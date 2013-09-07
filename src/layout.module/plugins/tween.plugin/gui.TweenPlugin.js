/**
 * Tracking tweens.
 * @extends {gui.Tracker}
 * @using {gui.Combo.chained}
 */
gui.TweenPlugin = ( function using ( chained ) {

	return gui.Tracker.extend ({

		/**
		 * Add one or more broadcast handlers.
		 * @param {object} arg
		 * @returns {gui.TweenPlugin}
		 */
		add : chained ( function ( arg ) {
			var sig = this._global ? null : this._sig;
			var message = gui.BROADCAST_TWEEN;
			this._breakdown ( arg ).forEach ( function ( type ) {
				if ( this._addchecks ( type, [ this._global ])) {
					if ( this._global ) {
						gui.Broadcast.addGlobal ( message, this );
					} else {
						gui.Broadcast.add ( message, this, sig );
					}
				}
			}, this );
		}),

		/**
		 * Remove one or more broadcast handlers.
		 * @param {object} arg
		 * @returns {gui.TweenPlugin}
		 */
		remove : chained ( function ( arg ) {
			var sig = this._global ? null : this._sig;
			var message = gui.BROADCAST_TWEEN;
			this._breakdown ( arg ).forEach ( function ( type ) {
				if ( this._removechecks ( type, [ this._global ])) {
					if ( this._global ) {
						gui.Broadcast.removeGlobal ( message, this );
					} else {
						gui.Broadcast.remove ( message, this, sig );
					}
				}
			}, this );
		}),

		/**
		 * Dispatch type(s).
		 * @param {object} arg
		 * @param @optional {object} data
		 * @returns {gui.Tween}
		 */
		dispatch : function ( arg, data ) {
			var result = null;
			var sig = this._global ? null : this._sig;
			this._breakdown ( arg ).forEach ( function ( type ) {
				if ( this._global ) {
					result = gui.Tween.dispatchGlobal ( type, data );
				} else {
					result = gui.Tween.dispatch ( type, data, sig );	
				}
			}, this );
			return result;
		},

		/**
		 * Add handlers for global broadcast(s).
		 * @param {object} arg
		 * @returns {gui.TweenPlugin}
		 */
		addGlobal : function ( arg ) {
			return this._globalize ( function () {
				return this.add ( arg );
			});
		},

		/**
		 * Add handlers for global broadcast(s).
		 * @param {object} arg
		 * @returns {gui.TweenPlugin}
		 */
		removeGlobal : function ( arg ) {
			return this._globalize ( function () {
				return this.remove ( arg );
			});
		},

		/**
		 * Dispatch type(s) globally.
		 * @param {object} arg
		 * @param @optional {object} data
		 * @returns {gui.Tween}
		 */
		dispatchGlobal : function ( arg, data ) {
			return this._globalize ( function () {
				return this.dispatch ( arg, data );
			});
		},

		/**
		 * Handle broadcast.
		 * @param {gui.Broadcast} b
		 */
		onbroadcast : function ( b ) {
			switch ( b.type ) {
				case gui.BROADCAST_TWEEN :
					var tween = b.data;
					if ( this._containschecks ( tween.type, [ b.global ])) {
						this.spirit.ontween ( tween ); // @TODO: try-catch for destructed spirit
					}
					break;
			}
		},

		// Private ...................................................................
		
		/**
		 * Remove broadcast subscriptions on dispose.
		 * @overwrites {gui.Tracker#_cleanup}
		 * @param {String} type
		 * @param {Array<object>} checks
		 */
		_cleanup : function ( type, checks ) {
			var message = gui.BROADCAST_TWEEN;
			var global = checks [ 0 ];
			var sig = global ? null : this._sig;
			if ( global ) {
				gui.Broadcast.removeGlobal ( message, this );
			} else {
				gui.Broadcast.remove ( message, this, this._sig );
			}
		}

	});

}( gui.Combo.chained ));