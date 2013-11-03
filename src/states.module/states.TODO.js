/**
 * Optional State instance.
 * @type {edb.Controller.State}
 */
_state : null,

/**
 * Optional SessionState instance.
 * @type {edb.Controller.SessionState}
 */
_sessionstate : null,

/**
 * Optional LocalState instance.
 * @type {edb.Controller.LocalState}
 */
_localstate : null,

/**
 * Fire up potential state models. Returns 
 * `true` if any state models are declared.
 * @returns {boolean}
 */
_startstates : function () {
	var State;

	// @TODO: don't use some here!!!
	return Object.keys ( gui.Spirit.$states ).some ( function ( state ) {
		if (( State = this.constructor [ state ])) {
			this._startstate ( State );
			return true;
		} else {
			return false;
		}
	}, this );
},

/**
 * Output state model only when the first 
 * instance of this spirit is constructed. 
 * Attempt to restore the stage from storage.
 * @param {function} State
 */
_startstate : function ( State ) {
	this.input.add ( State );
	if ( !State.out ( this.window )) {
		State.restore ( this.window ).then ( function ( state ) {
			state = state || new State ();
			state.$output ( this.window );
		}, this );
	}
},

/**
 * Assign state instance to private property name. 
 * Returns true when all expected states are done.
 * @param {function} State constructor
 * @param {edb.State} state instance
 * @returns {boolean}
 */
_statesstarted : function ( State, state ) {
	var MyState, propname, states = gui.Spirit.$states;
	return Object.keys ( states ).every ( function ( typename ) {
		MyState = this.constructor [ typename ];
		propname = states [ typename ];
		this [ propname ] = State === MyState ? state : null;
		return !MyState || this [ propname ] !== null;
	}, this ); 
},

/*
 * @TODO: move to EDB module somehow...
 */
if ( !this._startstates ) {
	if ( !gui.Spirit._didsayso ) {
		// console.warn ( "TODO: _startstates not setup nowadays" );
		gui.Spirit._didsayso = true;
	}
} else {
	if ( !this._startstates ()) {
		gui.Spirit.$oninit ( this );
	}
}

/**
 * Spirit of the spirit. A similar interface, only without spirit dependencies, 
 * should eventually be concieved to function inside the web worker context.
 * @extends {ts.gui.Spirit}
 *
ts.edb.Controller = ts.gui.Spirit.extend ({

	/**
	 * Called when all viewstates are restored/created and has been output on the page.
	 *
	oninit : function () {},

	/**
	 * Output viewstate models in public context. Invoke 
	 * `oninit` when all viewstates are accounted for.
	 *
	onconfigure : function () {
		this._super.onconfigure ();
		this.att.add ( "view" );
		if ( !this._startstates ()) {
			ts.edb.Controller.$oninit ( this );
		}
	},

	/**
	 * Handle attribute updated. This also fires when the attribute listener gets added.
	 * @param {gui.Att} att
	 *
	onatt : function ( att ) {
		this._super.onatt ( att );
		switch ( att.name ) {
			case "view" :
				this.script.load ( att.value );
				break;
		}
	},

	/**
	 * Handle input. In this case our own state models.
	 * @param {edb.Input} input
	 *
	oninput : function ( input ) {
		this._super.oninput ( input );
		if ( input.data instanceof ts.edb.State ) {
			if ( this._statesstarted ( input.type, input.data )) {
				ts.edb.Controller.$oninit ( this );
			}
		}
	},


	// Private .......................................................................

	/**
	 * Optional State instance.
	 * @type {ts.edb.Controller.State}
	 *
	_state : null,

	/**
	 * Optional SessionState instance.
	 * @type {ts.edb.Controller.SessionState}
	 *
	_sessionstate : null,

	/**
	 * Optional LocalState instance.
	 * @type {ts.edb.Controller.LocalState}
	 *
	_localstate : null,

	/**
	 * Fire up potential state models. Returns 
	 * `true` if any state models are declared.
	 * @returns {boolean}
	 *
	_startstates : function () {
		var State;
		return Object.keys ( ts.edb.Controller.$states ).some ( function ( state ) {
			if (( State = this.constructor [ state ])) {
				this._startstate ( State );
				return true;
			} else {
				return false;
			}
		}, this );
	},

	/**
	 * Output the state model only when the first 
	 * instance of this spirit is constructed. 
	 * Attempt to restore the stage from storage.
	 * @param {function} State
	 *
	_startstate : function ( State ) {
		this.input.add ( State );
		if ( !State.out ( self )) {
			State.restore ().then ( function ( state ) {
				state = state || new State ();
				state.$output ( self );
			}, this );
		}
	},

	/**
	 * Assign state instance to private property name. 
	 * Returns true when all expected states are done.
	 * @param {function} State constructor
	 * @param {ts.edb.State} state instance
	 * @returns {boolean}
	 *
	_statesstarted : function ( State, state ) {
		var MyState, propname, states = ts.edb.Controller.$states;
		return Object.keys ( states ).every ( function ( typename ) {
			MyState = this.constructor [ typename ];
			propname = states [ typename ];
			this [ propname ] = State === MyState ? state : null;
			return !MyState || this [ propname ] !== null;
		}, this ); 
	}



}, { // Recurring static ...........................................................

	/**
	 * Optional State constructor. The class will be declared using the spirit 
	 * classname as a namespacing mechanism of some kind: `myns.MyController.State`. 
	 * @extends {ts.edb.State}
	 *
	State : null,

	/**
	 * Optional SessionState constructor.
	 * @extends {ts.edb.SessionState}
	 *
	SessionState : null,

	/**
	 * Optional LocalState constructor.
	 * @extends {ts.edb.LocalState}
	 *
	LocalState : null,

	/**
	 * Allow State constructors to be created by nice shorhand notation. 
	 * Simply declare an object instead of `ts.edb.State.extend(object)`
	 * @overwrites {gui.Spirit.extend} 
	 * @TODO no spirits in worker context
	 *
	extend : function () {
		var args = [], def, breakdown = gui.Class.breakdown ( arguments );
		[ "name", "protos", "recurring", "statics" ].forEach ( function ( key ) {
			if (( def = breakdown [ key ])) {
				args.push ( key === "recurring" ? ts.edb.Controller.$longhand ( def ) : def );
			}
		}, this );
		return ts.gui.Spirit.extend.apply ( this, args );
	}


}, { // Static .....................................................................

	/**
	 * Mapping constructor identifiers to private property names.
	 * @type {Map<String,String>}
	 *
	$states : {
		"State" : "_state",
		"SessionState" : "_sessionstate",
		"LocalState" : "_localstate"
	}, 

	/**
	 * Init that spirit.
	 * @param {ts.edb.Controller} spirit
	 *
	$oninit : function ( spirit ) {
		spirit.life.initialized = true;
		spirit.life.dispatch ( "life-initialized" );
		spirit.oninit ();
	},

	/**
	 * Resolve shorthand notation for State constructors.
	 * @param {object} recurring Recurring static fields.
	 * @returns {object}
	 *
	$longhand : function ( recurring ) {
		var State;
		Object.keys ( this.$states ).forEach ( function ( typename ) {
			if (( State = recurring [ typename ])) {
				if ( gui.Type.isObject ( State ) && !State.$classid ) {
					recurring [ typename ] = ts.edb [ typename ].extend ( State );
				}
			}
		});
		return recurring;
	}

});
*/

/**
 * Handle input.
 * @param {edb.Input} input
 */
oninput : function ( input ) {
	/* 
	 * @TODO: get this out of here...
	 */
	if ( input.data instanceof edb.State ) {
		if ( this._statesstarted ( input.type, input.data )) {
			gui.Spirit.$oninit ( this );
		}
	}
},