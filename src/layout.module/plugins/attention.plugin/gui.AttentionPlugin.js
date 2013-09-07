/**
 * Work in progress keyboard TAB manager.
 * @extends {gui.Tracker}
 * @TODO Get this out of here
 * @TODO Nested attention traps (conflicts with missing focusin in FF?)
 * @TODO Empty queue when user moves escapes (all) attention traps?
 * @TODO More life cycle hookins (hide, show, detach, exit)
 * @using {gui.Combo.chained}
 */
gui.AttentionPlugin = ( function using ( chained ) {

	return gui.Plugin.extend ({

		/**
		 * Trapping TAB navigation inside the spirit subtree.
		 * @returns {gui.AttentionPlugin}
		 */
		trap : chained ( function () {
			if ( !this._trapping ) {
				this._trapping = true;
				this._listen ( true );
				this._setup ();
			}
		}),

		/**
		 * Focus the latest focused element, if any, defaulting to first focusable element.
		 * @returns {gui.AttentionPlugin}
		 */
		enter : chained ( function () {
			if ( !this._focused ) {
				if ( this._latest ) {
					this._latest.focus ();
				} else {
					this._first ();
				}
			}
		}),

		/**
		 * Blur anything that might be focused and instigate attention move.
		 * @returns {gui.AttentionPlugin}
		 */
		exit : chained ( function () {
			if ( this._focused && this._latest ) {
				this._latest.blur ();
			}
			this._exit ();
		}),

		/**
		 * Something was focused or blurred.
		 * @param {Event} e
		 */
		handleEvent : function ( e ) {
			switch ( e.type ) {
				case "blur" :
				case "focusout" :
					this._onblur ( e.target );
					break;
				case "focus" :
				case "focusin" :
					this._onfocus ( e.target );
					break;
			}
		},

		/**
		 * Handle broadcast.
		 * @param {gui.Broadcast} b
		 */
		onbroadcast : function ( b ) {
			if ( b.type === gui.BROADCAST_ATTENTION_MOVE ) {
				if ( b.data === this.spirit.$instanceid ) {
					this.enter();
				}
			}
		},

		/**
		 * Destuction time.
		 */
		ondestruct : function () {
			this._super.ondestruct ();
			if ( this._trapping ) {
				this._listen ( false );
			}
		},


		// Private ........................................................................

		/**
		 * Trapping attention?
		 * @type {boolean}
		 */
		_trapping : null,

		/**
		 * Latest focused element.
		 * @type {Element}
		 */
		_latest : null,

		/**
		 * Attention trap entered?
		 * @type {number}
		 */
		_entered : false,

		/**
		 * Append hidden inputs. When these are 
		 * focused, we move the focus elsewhere.
		 */
		_setup : function () {
			[ "before", "after" ].forEach ( function ( pos ) {
				var elm = this._input ( pos );
				var dom = this.spirit.dom;
				if ( pos === "before" ) {
					dom.prepend ( elm ); // @TODO try before
				} else {
					dom.append ( elm ); // @TODO try after
				}
			}, this );
		},

		/**
		 * Listen and unlisten for all sorts of stuff going on.
		 * @TODO use focusin and focusout for IE/Opera?
		 * @param {boolean} listen
		 */
		_listen : function ( listen ) {
			var element = this.spirit.element;
			var action1 = listen ? "addEventListener" : "removeEventListener";
			var action2 = listen ? "addGlobal" : "removeGlobal";
			element [ action1 ] ( "focus", this, true );
			element [ action1 ] ( "blur", this, true );
			gui.Broadcast [ action2 ] ( gui.BROADCAST_ATTENTION_MOVE, this );
		},

		/**
		 * Insert hidden input at position.
		 * @TODO how to *keep* inputs at first and last position?
		 * @TODO removeEventListener on dispose perhaps
		 * @param {String} pos
		 * @returns {Element}
		 */
		_input : function ( pos ) {
			var dom = this.spirit.dom;
			var doc = this.spirit.document;
			var elm = gui.CSSPlugin.style ( 
				doc.createElement ( "input" ), {
					position : "absolute",
					opacity : 0,
					height : 10,
					width : 10,
					top: -5000
				}
			);
			elm.className = "_gui-focus_" + pos;
			return elm;
		},

		/**
		 * Focus first focusable element and return it.
		 * @returns {Element}
		 */
		_first : function () {
			return this._find ( true );
		},

		/**
		 * Focus last focusable element and return it.
		 * @returns {Element}
		 */
		_last : function () {
			return this._find ( false );
		},

		/**
		 * Focus first or last focusable element and return it.
		 * @param {boolean} isfirst
		 * @returns {Element}
		 */
		_find : function ( isfirst ) {
			var elm = null, all = this._elements ();
			if ( all.length ) {
				elm = all [ isfirst ? 0 : all.length - 1 ];
				elm.focus ();
			}
			return elm;
		},

		/**
		 * List descendant links plus form controls minus input @type="image".
		 * @returns {Array<Element>}
		 */
		_elements : function () {
			return this.spirit.dom.descendants ().filter ( function ( elm ) {
				return this._focusable ( elm );
			}, this );
		},

		/**
		 * Element is focusable form control or link?
		 * Excluding the hidden inputs for TAB contain.
		 * @param {Element} elm
		 * @returns {boolean}
		 */
		_focusable : function ( elm ) {
			var is = false;
			switch ( elm.localName ) {
				case "input" :
				case "textarea" :
				case "select" :
				case "button" :
				case "a" :
					if ( elm.tabIndex >-1 ) {
						if ( elm.type !== "image" ) {						
							if ( !elm.className.startsWith ( "_gui-focus" )) {
								is = true;
							}
						}
					}
					break;
			}
			return is;
		},

		/**
		 * Something was focused.
		 * @param {Element} elm
		 */
		_onfocus : function ( elm ) {
			this._focused = true;
			this._latest = elm;
			if ( !this._entered ) { // trap just entered?
				this._entered = true;
				this._enter ();
			}
			var klas = elm.className; // was hidden input?
			if ( klas.startsWith ( "_gui-focus" )) {
				if ( klas.contains ( "after" )) {
					this._first ();
				} else {
					this._last ();
				}
			}
		},

		/**
		 * Something was blurred. If nothing new gets focused soon, we determine 
		 * that an exit was performed. Not that this doesn't move to focus back 
		 * to any previous zone, you must invoke a manual 'exit()' for this.
		 * @param {Element} elm (not used)
		 */
		_onblur : function ( elm ) {
			var that = this;
			this._focused = false;
			setTimeout(function(){
				if ( !that._focused ) {
					that._entered = false;
				}
			});
		},

		/**
		 * Broadcast zone entered-
		 */
		_enter : function () {
			gui.Broadcast.dispatchGlobal ( null,
				gui.BROADCAST_ATTENTION_ENTER,
				this.spirit.$instanceid
			);
		},

		/**
		 * Broadcast zone exited.
		 */
		_exit : function () {
			gui.Broadcast.dispatchGlobal ( null,
				gui.BROADCAST_ATTENTION_EXIT,
				this.spirit.$instanceid
			);
		}


	}, { // Static ........................................................................

		/**
		 * Listing $instanceids.
		 * @type {Array<String>}
		 */
		_queue : [],

		/**
		 * Get latest $instanceid.
		 * @TODO continue until next is not hidden.
		 * @returns {String}
		 */
		_last : function () {
			var q = this._queue; 
			return q [ q.length - 1 ];
		},

		/**
		 * Handle broadcast.
		 * @param {gui.Broadcast} b
		 */
		onbroadcast : function ( b ) {
			var q = this._queue;
			var id = b.data;
			switch ( b.type ) {
				case gui.BROADCAST_ATTENTION_ENTER :
					if ( this._last () !== id ) {
						q.push ( id );
					}
					break;
				case gui.BROADCAST_ATTENTION_EXIT :
					var that = this;
					setTimeout ( function () {
						that._update ( id );
					}, 0 );
					break;
			}
		},

		/**
		 * Update attention.
		 * @param {String} id
		 */
		_update : function ( id ) {
			var q = this._queue;
			if ( this._last () === id ) {
				q = this._queue = q.filter ( function ( i ) {
					return i !== id;
				});
			}
			if ( q.length ) {
				gui.Broadcast.dispatchGlobal ( null,
					gui.BROADCAST_ATTENTION_MOVE,
					this._last ()
				);
			}
		}

	});

}( gui.Combo.chained ));

/**
 * Manage attention queue.
 */
( function () {
	gui.Broadcast.addGlobal ([ 
		gui.BROADCAST_ATTENTION_ENTER,
		gui.BROADCAST_ATTENTION_EXIT
	], gui.AttentionPlugin );
}());