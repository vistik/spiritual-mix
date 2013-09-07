/**
 * Computer for flexbox child.
 * @param {Element} elm
 */
gui.FlexChild = function FlexChild ( elm ) {
	this._element = elm;
};

gui.FlexChild.prototype = {

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString : function () {
		return "[object gui.FlexChild]";
	},

	/**
	 * Get flex value for element. We use the flexN classname to markup this.
	 * @returns {number}
	 */
	getflex : function () {
		var flex = 0;
		this._element.className.split ( " ").forEach ( function ( name ) {
			if ( gui.FlexChild._FLEXNAME.test ( name )) {
				flex = ( gui.FlexChild._FLEXRATE.exec ( name ) || 1 );
			}
		});
		return gui.Type.cast ( flex );
	},

	/**
	 * Get width or height of element depending on flexbox orientation.
	 * @param {boolean} vertical
	 * @returns {number} Offset in pixels
	 */
	getoffset : function ( vertical ) {
		var elm = this._element;
		if ( vertical ) {
			return elm.offsetHeight;
		} else {
			return elm.offsetWidth;
		}
	},

	/**
	 * Set percentage width|height of element.
	 * @param {number} pct
	 * @param {boolean} vertical
	 */
	setoffset : function ( pct, vertical ) {
		var prop = vertical ? "height" : "width";
		this._element.style [ prop ] = pct + "%";
	},

	/**
	 * Remove *all* inline styles from flexchild element.
	 */
	unflex : function () {
		this._element.removeAttribute ( "style" );
	},

	/**
	 * Potentially adds a classname "_flexcorrect" to apply negative left margin. 
	 * @todo Measure computed font-size and correlate to negative margin value.
	 */
	flexcorrect : function () {
		var elm = this._element;
		if ( elm.previousSibling.nodeType === Node.TEXT_NODE ) {
			gui.CSSPlugin.add ( elm, gui.FlexChild._FLEXCORRECT );
		}
	},

	// Private .........................................................
		
	/**
	 * Flexchild element.
	 * @type {Element}
	 */
	_element : null,

	_enable : function ( enable ) {
		var name, next, elm = this._element, css = gui.CSSPlugin;
		this._element.className.split ( " ").forEach ( function ( klass ) {
			name = enable ? klass + "-disabled" : klass;
			next = enable ? klass : klass + "-disabled";
			if ( gui.FlexChild._FLEXNAME.test ( klass )) {	
				if ( css.contains ( elm, name )) {
					css.remove ( elm, name ).add ( elm, next );
				}
			}
		});
	}

};


// Static ............................................................

/**
 * Classname applies negative left margin to counter 
 * horizontal spacing on inline-block elements.
 * @type {String}
 */
gui.FlexChild._FLEXCORRECT = "_flexcorrect";

/**
 * Check for flexN classname.
 * @type {RegExp}
 */
gui.FlexChild._FLEXNAME = /^flex\d*$/;

/**
 * Extract N from classname (eg .flex23).
 * @type {RegExp}
 */
gui.FlexChild._FLEXRATE = /\d/;