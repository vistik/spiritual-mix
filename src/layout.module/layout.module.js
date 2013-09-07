/**
 * It's the layout module.
 */
gui.module ( "layout", {

	/**
	 * Assign plugins to prefixes for all {gui.Spirit}.
	 */
	plugins : {
		
		"attention" : gui.AttentionPlugin,
		"tween" : gui.TweenPlugin,
		"transition" : gui.TransitionPlugin,
		"visibility" : gui.VisibilityPlugin
 },

	/**
	 * Methods added to {gui.Spirit.prototype}
	 */
	mixins : {

		/**
		 * Handle tween.
		 * @param {gui.Tween}
		 */
		ontween : function ( tween ) {},

		/**
		 * Handle transiton end.
		 * @param {gui.TransitionEnd} transition
		 */
		ontransition : function ( transition ) {},

		/**
		 * Handle visibility.
		 */
		onvisible : function () {},

		/**
		 * Handle invisibility.
		 */
		oninvisible : function () {}
	}

});