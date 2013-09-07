/**
 * Properties and methods to be mixed into the context-local {gui.Spiritual} instance. 
 * @using {gui.Property#nonenumerable}
 */
gui.FlexMode = ( function using ( nonenumerable ) {

	return {
		
		/**
		 * Flipped on CSS injected.
		 * @type {boolean}
		 */
		flexloaded : nonenumerable ({
			writable : true,
			value : false
		}),

		/**
		 * Flexmode accessor. Note that flexmode exposes as either native or emulated (never optimized).
		 * Note to self: enumerable false is to prevent portalling since this would portal the flexmode.
		 */
		flexmode : nonenumerable ({
			get : function () { 
				var best = gui.Client.hasFlexBox ? gui.FLEXMODE_NATIVE : gui.FLEXMODE_EMULATED;
				return this._flexmode === gui.FLEXMODE_OPTIMIZED ? best : this._flexmode;
			},
			set : function ( next ) { // supports hotswapping for debugging
				this._flexmode = next;
				var best = gui.Client.hasFlexBox ? gui.FLEXMODE_NATIVE : gui.FLEXMODE_EMULATED;
				var mode = next === gui.FLEXMODE_OPTIMIZED ? best : next;
				gui.FlexCSS.load ( this.window, mode );
				if ( this.document.documentElement.spirit ) { // @todo life cycle markers for gui.Spiritual
					switch ( mode ) {
						case gui.FLEXMODE_EMULATED :
							this.reflex ();
							break;
						case gui.FLEXMODE_NATIVE :
							this.unflex ();
							break;
					}
				}
			}
		}),

		/**
		 * Flex everything.
		 */
		reflex : nonenumerable ({
			value : function ( elm ) {
				if ( this.flexmode === this.FLEXMODE_EMULATED ) {
					gui.FlexPlugin.reflex ( elm || this.document.body );
				}
			}
		}),
		
		/**
		 * Remove flex (removes all inline styling on flexbox elements).
		 */
		unflex : nonenumerable ({
			value : function ( elm ) {
				gui.FlexPlugin.unflex ( elm || this.document.body, true );
			}
		})
	};

}( gui.Property.nonenumerable ));