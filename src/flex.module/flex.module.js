gui.FLEXMODE_NATIVE = "native";
gui.FLEXMODE_EMULATED = "emulated";
gui.FLEXMODE_OPTIMIZED = "optimized",

/**
 * Provides a subset of flexible boxes that works in IE9 
 * as long as flex is implemented using a predefined set 
 * of classnames: flexrow, flexcol and flexN where N is 
 * a number to indicate the flexiness of child elements.
 * @todo Reflex on window resize...
 * @see {gui.FlexCSS}
 */
gui.module ( "flex", {

	/** 
	 * Setup gui.FlexPlugin for all spirits. Spirits may 
	 * update subtree flex by using `this.flex.reflex()`
	 */
	plugins : {
		flex : gui.FlexPlugin
	},

	/**
	 * Setup flex control on the local "gui" object. Note that we  assign non-enumerable properties 
	 * to prevent the setup from being portalled into subframes (when running a multi-frame setup).
	 * @param {Window} context
	 */
	oncontextinitialize : function ( context ) {
		context.gui._flexmode = gui.FLEXMODE_OPTIMIZED;
		context.Object.defineProperties ( context.gui, gui.FlexMode );
	},

	/**
	 * Inject the relevant stylesheet (native or emulated) before startup spiritualization.
	 * @todo Make sure stylesheet onload has fired to prevent flash of unflexed content?
	 * @param {Window} context
	 */
	onbeforespiritualize : function ( context ) {
		this._edbsetup ( context );
		if ( !context.gui.flexloaded ) { // @see {gui.FlexCSS}
			gui.FlexCSS.load ( context, context.gui.flexmode );
		}
	},

	/**
	 * Flex everything on startup and resize. 
	 * @TODO put broadcast into if statement
	 * @param {Window} context
	 */
	onafterspiritualize : function ( context ) {
		var root = context.document.documentElement.spirit;
		if ( context.gui.flexmode === gui.FLEXMODE_EMULATED ) {
			try {
				gui.CSSPlugin.compute ( root, "display" );
				context.gui.reflex ();
			} catch ( geckoexception ) {
				/*
				if ( !gui.Type.isDefined ( root.life.visibility )) {
					root.life.add ( gui.LIFE_VISIBLE, this ); // doesn't work...
				}
				*/
			}
		}
		gui.Broadcast.addGlobal ( gui.BROADCAST_RESIZE_END, {
			onbroadcast : function () {
				if ( context.gui.flexmode === gui.FLEXMODE_EMULATED )	{
					context.gui.reflex ();
				}
			}
		});
	},

	/**
	 * Cleanup on window unload.
	 * @param {Window} context
	 */
	oncontextunload : function ( context ) {
		gui.FlexCSS.unload ( context );
	},

	/**
	 * Still no luck with Gecko unless we alert at this point :(
	 * Perhaps onvisible not updated right in gui.DocumentSpirit?
	 * @param {gui.Life} life
	 *
	onlife : function ( life ) {
		if ( life.type === gui.LIFE_VISIBLE ) {
			setTimeout(function(){
				life.target.window.gui.reflex ();
			},250);
		}
	},
	*/


	// Private ...................................................
	 
	/*
	 * Bake reflex into EDBML updates to catch flex related attribute updates etc. 
	 * (by default we only reflex whenever DOM elements get inserted or removed)
	 * @todo Suspend default flex to only flex once
	 */
	_edbsetup : function ( context ) {
		if ( context.gui.hasModule ( "edb" )) {
			var script = context.edb.ScriptPlugin.prototype;
			gui.Function.decorateAfter ( script, "write", function () {
				if ( this.spirit.window.gui.flexmode === gui.FLEXMODE_EMULATED ) {
					/* 
					 * @TODO: We think that some kind of DOM-hookin will do this 
					 * again after some milliseconds, it should only happen once.
					 */
					this.spirit.flex.reflex ();
				}
			});
		}
	}
	
});

/**
 * Manage emulated flex whenever DOM elements get added and removed.
 * Mixing into 'gui.Guide._spiritualize' and 'gui.Guide._materialize'
 * @todo Both of these methods should be made public we presume...
 * @using {gui.Guide}
 */
( function decorate ( guide ) {

	/*
	 * Flex subtree starting from the parent node of given node.
	 * @param {Node|gui.Spirit} child
	 */
	function flexparent ( child ) {
		var doc, win;
		child = child instanceof gui.Spirit ? child.element : child;
		doc = child.ownerDocument;
		win = doc.defaultView;
		if ( win.gui.flexmode === gui.FLEXMODE_EMULATED ) {
			if ( gui.DOMPlugin.embedded ( child )) {
				child = child === doc.documentElement ? child : child.parentNode;
				gui.Tick.next ( function () {
					try {
						gui.FlexPlugin.reflex ( child );
					} catch ( unloadedexception ) {
						// TODO: Don't go here
					}
				});
			}
		}
	}

	/*
	 * @TODO: public hooks for this kind of thing
	 */
	[ "_spiritualize", "_materialize" ].forEach ( function ( method ) {
		gui.Function.decorateAfter ( guide, method, flexparent );
	});

}( gui.Guide ));