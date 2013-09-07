/**
 * Facilitate flexbox-like layouts in IE9 
 * provided a fixed classname structure.
 * @extends {gui.Plugin}
 */
gui.FlexPlugin = gui.Plugin.extend ({

	/**
	 * Flex this and descendant flexboxes in document order.
	 */
	reflex : function () {
		gui.FlexPlugin.reflex ( this.spirit.element );
	},

	/**
	 * Remove inline (emulated) styles.
	 */
	unflex : function () {
		gui.FlexPlugin.unflex ( this.spirit.element );
	},

	/**
	 * Hejsa med dig.
	 */
	enable : function () {
		gui.FlexPlugin.enable ( this.spirit.element );
	},

	/**
	 * Hejsa med dig.
	 */
	disable : function () {
		gui.FlexPlugin.disable ( this.spirit.element );
	}


}, {}, { // Static ................................................

	/**
	 * Flex this and descendant flexboxes in document order.
	 * @param {Element} elm
	 */
	reflex : function ( elm ) {
		if ( this._emulated ( elm )) {
			this._crawl ( elm, "flex" );
		}
	},

	/**
	 * Remove inline (emulated) styles.
	 * @param {Element} elm
	 * @param @optional {boolean} hotswap Switching from emulated to native?
	 */
	unflex : function ( elm, hotswap ) {
		if ( this._emulated ( elm ) || hotswap ) {
			this._crawl ( elm, "unflex" );
		}
	},

	/**
	 * Hejsa med dig.
	 * @param {Element} elm
	 */
	enable : function ( elm ) {
		this._crawl ( elm, "enable" );
		if ( this._emulated ( elm )) {
			this.reflex ( elm );
		}
	},

	/**
	 * Hejsa med dig.
	 * @param {Element} elm
	 */
	disable : function ( elm ) {
		if ( this._emulated ( elm )) {
			this.unflex ( elm );
		}
		this._crawl ( elm, "disable" );
	},


	// Private static ........................................................

	/**
	 * Element context runs in emulated mode?
	 * @param {Element} elm
	 * @returns {boolean}
	 */
	_emulated : function ( elm ) {
		var doc = elm.ownerDocument;
		var win = doc.defaultView;
		return win.gui.flexmode === gui.FLEXMODE_EMULATED;
	},

	/**
	 * Flex / disable / unflex element and descendants.
	 * @param {Element} elm
	 * @param {String} action
	 */
	_crawl : function ( elm, action ) {
		var disabled = action === "enable";
		if ( this._shouldflex ( elm, disabled )) {
			var boxes = this._getflexboxes ( elm, disabled );
			boxes.forEach ( function ( box ) {
				box [ action ]();
			});
		}
	},

	/**
	 * Element is flexbox or contains flexible stuff?
	 * @param {Element} elm
	 * @returns {boolean}
	 */
	_shouldflex : function ( elm, disabled ) {
		return elm.nodeType === Node.ELEMENT_NODE && 
			this._isflex ( elm, disabled ) || 
			this._hasflex ( elm, disabled ); 
	},

	/**
	 * Element is (potentially disabled) flexbox?
	 * @param {Element} elm
	 * @param {boolean} disabled
	 * @return {boolean}
	 */
	_isflex : function ( elm, disabled ) {
		return [ "flexrow", "flexcol" ].some ( function ( name ) {
			name = name + ( disabled ? "-disabled" : "" );
			return gui.CSSPlugin.contains ( elm, name );
		});
	},

	/**
	 * Element contains flexbox(es)?
	 * @param {Element} elm
	 * @param {boolean} disabled
	 * @return {boolean}
	 */
	_hasflex : function ( elm, disabled ) {
		return [ "flexrow", "flexcol" ].some ( function ( name ) {
			name = name + ( disabled ? "-disabled" : "" );
			return elm.querySelector ( "." + name );
		});
	},

	/**
	 * Collect descendant-and-self flexboxes.
	 * @param @optional {Element} elm
	 * @returns {Array<gui.FlexBox>}
	 */
	_getflexboxes : function ( elm, disabled ) {
		var display, boxes = [];
		new gui.Crawler ( "flexcrawler" ).descend ( elm, {
			handleElement : function ( elm ) {
				try {
					display = gui.CSSPlugin.compute ( elm, "display" );
				} catch ( geckoexception ) { // probably display:none
					return gui.Crawler.STOP;
				}
				if ( display === "none" ) { 
					return gui.Crawler.SKIP_CHILDREN;
				} else if ( gui.FlexPlugin._isflex ( elm, disabled )) {
					boxes.push ( new gui.FlexBox ( elm ));
				}
			}
		});
		return boxes;
	}

});