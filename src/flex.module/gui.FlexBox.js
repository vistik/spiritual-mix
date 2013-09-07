/**
 * Computer for flexbox.
 * @param {Element} elm
 */
gui.FlexBox = function FlexBox ( elm ) {
	this._onconstruct ( elm );
};

gui.FlexBox.prototype = {

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString : function () {
		return "[object gui.FlexBox]";
	},

	/**
	 * Flex everything using inline styles.
	 */
	flex : function () {
		this._flexself ();
		this._flexchildren ();
		this._flexcorrect ();
	},

	/**
	 * Remove *all* inline styles from flexbox element.
	 */
	unflex : function () {
		this._element.removeAttribute ( "style" );
		this._children.forEach ( function ( child ) {
			child.unflex ();
		});
	},

	/**
	 * Disable flex (perhaps to fit a mobile screen).
	 */
	disable : function () {
		this._enable ( false );
	},

	/**
	 * Enable flex.
	 */
	enable : function () {
		this._enable ( true );
	},


	// Private ................................................................
	
	/**
	 * Flexbox element.
	 * @type {Element}
	 */
	_element : null,

	/**
	 * Flexed children.
	 * @type {Array<Element>}
	 */
	_children : null,

	/**
	 * Vertical flexbox?
	 * @type {boolean}
	 */
	_flexcol : false,

	/**
	 * Loosen up to contain content.
	 * @type {Boolean}
	 */
	_flexlax : false,

	/**
	 * Constructor.
	 * @param {Element} elm
	 */
	_onconstruct : function ( elm ) {
		this._element = elm;
		this._flexcol = this._hasclass ( "flexcol" );
		this._flexlax = this._hasclass ( "flexlax" );
		this._children = this._collectchildren ( elm );
	},

	/**
	 * Collecting children that are not hidden.
	 * @todo Discompute absolute and floated (vertical) children
	 * @param {Element} elm
	 * @return {Array<gui.FlexChild>}
	 */
	_collectchildren : function ( elm ) {
		return Array.filter ( elm.children, function ( child ) {
			return this._shouldflex ( child );
		}, this ).map ( function ( child ) {
			return new gui.FlexChild ( child );
		});
	},
	
	/**
	 * Flex the container. Tick.next solves an issue with _relaxflex that 
	 * would manifest when going from native to emulated layout (but not 
	 * when starting out in emulated), this setup would better be avoided. 
	 * Note to self: Bug is apparent in demo "colspan-style variable flex"
	 */
	_flexself : function () {
		var elm = this._element;
		if ( this._flexcol && this._flexlax ) {
			this._relaxflex ( elm ); // first time to minimize flashes in FF (does it work?)
			gui.Tick.next(function(){ // second time to setup expected layout
				this._relaxflex ( elm );
			},this);
		}
	},

	/**
	 * Relax flex to determine whether or not to maxheight (own) element.
	 * @param {Element} elm
	 */
	_relaxflex : function ( elm ) {
		var style = elm.style;
		var given = style.height;
		var above = elm.parentNode;
		var avail = above.offsetHeight;
		style.height = "auto";
		if ( elm.offsetHeight < avail ) {
			style.height = given || "100%";
		}
	},

	/**
	 * Flex the children.
	 */
	_flexchildren : function () {
		var flexes = this._childflexes ();
		var factor = this._computefactor ( flexes );
		if ( flexes.length ) {
			var unit = 100 / flexes.reduce ( function ( a, b ) {
				return a + b;
			});
			this._children.forEach ( function ( child, i ) {
				if ( flexes [ i ] > 0 ) {
					var percentage = flexes [ i ] * unit * factor;
					child.setoffset ( percentage, this._flexcol );
				}
			},this);
		}
	},

	/**
	 * Eliminate spacing between inline-block children. Potentially 
	 * adds a classname "_flexcorrect" to apply negative left margin.
	 * @see {gui.FlexCSS}
	 */
	_flexcorrect : function () {
		if ( !this._flexcol ) {
			this._children.forEach ( function ( child, i ) {
				if ( i > 0 ) {
					child.flexcorrect ();
				}
			});
		}
	},

	/**
	 * Collect child flexes. Disabled members enter as 0.
	 * @return {Array<number>}
	 */
	_childflexes : function () {
		return this._children.map ( function ( child ) {
			return child.getflex ();
		},this);
	},

	/**
	 * Get modifier for percentage widths 
	 * accounting for fixed width members.
	 * @param {<Array<number>} flexes
	 * @return {number} Between 0 and 1
	 */
	_computefactor : function ( flexes ) {
		var all, cut, factor = 1;
		if ( flexes.indexOf ( 0 ) >-1 ) {
			all = cut = this._getoffset ();
			this._children.forEach ( function ( child, i ) {
				cut -= flexes [ i ] ? 0 : child.getoffset ( this._flexcol );
			}, this );
			factor = cut / all;
		}
		return factor;
	},

	/**
	 * Get width or height of element (depending on flexbox orientation).
	 * @returns {number} Offset in pixels
	 */
	_getoffset : function () {
		var elm = this._element;
		if ( this._flexcol ) {
			return elm.offsetHeight;
		} else {
			return elm.offsetWidth;
		}
	},

	/**
	 * Enable/disable flex classname. Child element flexN classname 
	 * becomes disabled by being scoped to flexrow or flexcol class.
	 * @param {boolean} enable
	 */
	_enable : function ( enable ) {
		var name, next, elm = this._element, css = gui.CSSPlugin;
		[ "flexrow", "flexcol" ].forEach ( function ( klass ) {
			name = enable ? klass + "-disabled" : klass;
			next = enable ? klass : klass + "-disabled";
			if ( css.contains ( elm, name )) {
				css.remove ( elm, name ).add ( elm, next );
			}
		});
	},

	/**
	 * Should child element be fed to computer for emulated mode?
	 * @todo Position absolute might qualify for exclusion...
	 * @param {Element} elm
	 * @returns {boolean}
	 */
	_shouldflex : function ( elm ) {
		return gui.CSSPlugin.compute ( elm, "display" ) !== "none";
	},

	/**
	 * Has classname?
	 * @param {String} name
	 * @returns {String}
	 */
	_hasclass : function ( name ) {
		return gui.CSSPlugin.contains ( this._element, name );
	}
};