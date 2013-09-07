/**
 * Do what Spiritual does by overloading JQuery methods instead of native DOM methods.
 * @TODO reduce crawled collections using compareDocumentPosition (also on following and preceding)
 * @TODO (Angular special) handle function replaceWith, "a special jqLite.replaceWith, which can replace items which have no parents"
 */
gui.module ( "jquery", {

	/**
	 * Hack Spiritual in top window.
	 * @param {Window} context
	 */
	oncontextinitialize : function ( context ) {
		if ( context === top ) {
			this._spiritualdom ();
		}
	},

	/**
	 * Hack JQuery in all windows.
	 * @param {Window} context
	 */
	onbeforespiritualize : function ( context ) {
		var root = context.document.documentElement;
		if ( context.gui.mode === gui.MODE_JQUERY ) {
			var jq = context.jQuery;
			jq.__rootnode = root;
			this._instance ( jq );
			this._expandos ( jq );
			this._overload ( jq, context );
		}
	},


	// Private .............................................................

	/**
	 * Generating spirit management methods. 
	 * Note that we add a double underscore.
	 * @param {jQuery} jq
	 */
	_expandos : function ( jq ) {
		jq.__suspend = false;
		[ 
			"spiritualize", 
			"spiritualizeSub", 
			"spiritualizeOne",
			"materialize", 
			"materializeSub", 
			"materializeOne",
			"detach"
		].forEach ( function ( method ) {
			jq.fn [ "__" + method ] = function () {
				gui.DOMPlugin.group ( Array.map ( this, function ( elm ) {
					return elm; // this.toArray () doesn't seem to compute :/
				})).forEach ( function ( elm ) {
					gui.Guide [ method ] ( elm );
				});
				return this;
			};
		});
	},

	/**
	 * Fixing JQuery instance constructor to detect when the user 
	 * instantiates JQuery in an external window context (iframes).
	 * @param {function} jq JQuery constructor
	 */
	_instance : function ( jq ) {
		var Init = jq.fn.init;
		var home = jq.__rootnode.ownerDocument.defaultView;
		if ( home.gui.debug ) {
			jq.fn.init = function ( selector, context, rootjQuery ){
				var inst = new Init ( selector, context, rootjQuery );
				var test = inst [ 0 ];
				if ( test && test.nodeType === Node.ELEMENT_NODE ) {
					if ( test.ownerDocument !== home.document ) {
						throw new Error ( "JQuery was used to handle elements in another window. Please use a locally loaded version of JQuery." );
					}
				}
				return inst;
			};
		}
	},

	/**
	 * Overloading DOM manipulation methods.
	 * @param {function} jq Constructor
	 * @param {Window} context
	 */
	_overload : function ( jq, context ) {
		var module = this;
		var naive = Object.create ( null ); // mapping unmodified methods
		[ 
			"attr", 
			"removeAttr"
		].forEach ( function ( name ) {
			naive [ name ] = jq.fn [ name ];
			jq.fn [ name ] = function () {
				var nam = arguments [ 0 ];
				var val = arguments [ 1 ];
				var del = name === "removeAttr";
				val = del ? null : val;
				if ( val !== undefined || del ) {
					this.each ( function ( i, elm ) {
						if ( elm.spirit ) {
							if ( val !== undefined || del ) {
								elm.spirit.att.set ( nam, val ); // trigger attribute setters
							}
						}
					});
				}
				return naive [ name ].apply ( this, arguments ); // @TODO: before spirit.att.set?
			};
		});
		[
			"after", 
			"append", 
			"appendTo", 
			"before", 
			"detach", 
			"empty", 
			"html", 
			"text", 
			"insertAfter", 
			"insertBefore", 
			"prepend", 
			"prependTo", 
			"remove", 
			"replaceAll", 
			"replaceWith", 
			"unwrap", 
			"wrap", 
			"wrapAll", 
			"wrapInner"
		].forEach ( function ( name ) {
			naive [ name ] = jq.fn [ name ];
			jq.fn [ name ] = function () {
				var res;
				var that = this;
				var args = arguments;
				var set = arguments.length > 0;
				function suber () {
					return gui.Observer.suspend ( jq.__rootnode, function () {
						return naive [ name ].apply ( that, args );
					}, that );
				}
				if ( context.gui.mode !== gui.MODE_JQUERY ) {
					res = suber ();
				} else if ( jq.__suspend ) {
					res = suber ();
				} else if ( name === "text" ) {
					if ( set ) {
						this.__materializeSub ();
					}
					res = suber ();
				} else {
					var arg = function() { return set ? jq ( args [ 0 ]) : undefined; };
					jq.__suspend = true;
					switch ( name ) {
						case "append" :
						case "prepend" :
							res = module._append_prepend.call ( this, name === "append", suber, jq );
							break;
						case "after" :
						case "before" :
							res = module._after_before.call ( this, name === "after", suber, jq );
							break;
						case "appendTo" :
							res = suber ();
							arg ().each ( function ( i, m ) {
								jq ( m ).last ().__spiritualize ();
							});
							break;
						case "prependTo" :
							res = suber ();
							arg ().each ( function ( i, m ) {
								jq ( m ).first ().__spiritualize ();
							});
							break;
						case "insertAfter" :
							res = suber ();
							arg ().next ().__spiritualize ();
							break;
						case "insertBefore" :
							res = suber ();
							arg ().prev ().__spiritualize ();
							break;
						case "detach" :
						case "remove" :
							this.__detach ();
							res = suber ();
							break;
						case "replaceAll" :	
							res = module._replaceall_replacewith ( this, arg (), suber );
							break;
						case "replaceWith" :
							res = module._replaceall_replacewith ( arg (), this, suber );
							break;
						case "empty" :
							this.__materializeSub ();
							res = suber ();
							break;
						case "html" :
							if ( set ) {
								this.__materializeSub ();
							}
							res = suber ();
							if ( set ) {
								this.__spiritualizeSub ();
							}
							break;
						case "unwrap" :
							// note: materialize(sub) is skipped here!
							this.parent ().__materializeOne ();
							res = suber ();
							break;
						case "wrap" :
						case "wrapAll" :
							// note: materialize(sub) is skipped here!
							res = suber ();
							this.parent ().__spiritualizeOne ();
							break;
						case "wrapInner" :
							res = suber ();
							this.__spiritualize ();
							break;
					}
					jq.__suspend = false;
				}
				return res;
			};
		});
	},
	
	/**
	 * Overload Spiritual to spiritualize/materialize spirits on DOM mutation and to 
	 * suspend mutation monitoring while DOM updating. This would normally (in native 
	 * mode) be baked into native DOM methods appendChild, removeChild and so on.
	 * @see {gui.DOMPlugin}
	 */
	_spiritualdom : function () {
		// overloading this fellow
		var plugin = gui.DOMPlugin.prototype;
		// @param {gui.Spirit} spirit
		// @returns {object}
		function breakdown ( spirit ) {
			var elm = spirit.element;
			var doc = elm.ownerDocument;
			var win = doc.defaultView;
			var dom = spirit.dom.embedded();
			var is$ = win.gui.mode === gui.MODE_JQUERY;
			return { elm : elm, doc : doc, win : win, dom : dom, is$ : is$ };
		}
		// manage invoker subtree.
		[ "html", "empty", "text" ].forEach ( function ( method ) {
			var old = plugin [ method ];
			plugin [ method ] = function () {
				var args = arguments, res;
				var b = breakdown ( this.spirit );
				if ( b.is$ ) {
					if ( b.dom ){
						gui.Guide.materializeSub ( b.elm );
					}
					res = gui.Observer.suspend ( b.elm, function () {
						return old.apply ( this, args );
					}, this );
					if ( b.dom && method === "html" ) {
						gui.Guide.spiritualizeSub ( b.elm );
					}
				} else {
					res = old.apply ( this, args );
				}
				return res;
			};
		});
		// manage invoker itself.
		[ "remove" ].forEach ( function ( method ) {
			var old = plugin [ method ];
			plugin [ method ] = function () {
				var args = arguments, res;
				var b = breakdown ( this.spirit );
				if ( b.is$ ) {
					if ( b.dom ) {
						gui.Guide.detach ( b.elm );
					}
					res = gui.Observer.suspend ( b.elm, function () {
						return old.apply ( this, args );
					}, this );
				} else {
					res = old.apply ( this, args );
				}
				return res;
			};
		});
		// manage targeted element(s)
		[ "append", "prepend", "before", "after" ].forEach ( function ( method ) {
			var old = plugin [ method ];
			plugin [ method ] = function ( things ) {
				var res, b = breakdown ( this.spirit );
				if ( b.is$ ) {
					res = gui.Observer.suspend ( b.elm, function () {
						return old.call ( this, things );
					}, this );
					if ( b.dom ) {
						things = gui.Array.toArray ( things );
						var els = Array.map ( things, function ( thing ) {
							return thing && thing instanceof gui.Spirit ? thing.element : thing;
						});
						els.forEach ( function ( el ) {
							gui.Guide.spiritualize ( el );
						});
					}
				} else {
					res = old.call ( this, things );
				}
				return res;
			};
		});
	},

	/**
	 * JQuery append() and prepend().
	 * @param {boolean} append
	 * @param {function} suber
	 */
	_append_prepend : function ( append, suber ) {
		var last = "lastElementChild";
		var fist = "firstElementChild";
		var next = "nextElementSibling";
		var prev = "previousElementSibling";
		var current = Array.map ( this, function ( elm ) {
			return elm [ append ? last : fist ];
		});
		var old, res = suber ();
		this.each ( function ( index, elm ) {
			if (( old = current [ index ])) {
				elm = old [ append ? next : prev ];
			} else {
				elm = elm.firstElementChild;
			}	
			while ( elm ) {
				gui.Guide.spiritualize ( elm );	
				elm = elm [ append ? next : prev ];
			}
		});
		return res;
	},
	
	/**
	 * JQuery after() and before(). We can't reliably use the arguments 
	 * here becayse JQuery will switch them to clones in the process. 
	 * @param {boolean} after
	 * @param {function} suber
	 */
	_after_before : function ( after, suber ) {
		var res, sib, current = [];
		var target = after ? "nextSibling" : "previousSibling";
		function sibling ( node ) {	// (node may be a comment)
			node = node [ target ];
			while ( node && node.nodeType !== Node.ELEMENT_NODE ) {
				node = node [ target ];
			}
			return node;
		}
		this.each ( function ( i, elm ) {
			while ( elm && current.indexOf ( elm ) === -1 ) {
				current.push ( elm );
				elm = sibling ( elm );
			}
		});
		res = suber ();
		this.each ( function ( i, elm ) {
			sib = sibling ( elm );
			while ( sib && current.indexOf ( sib ) === -1 ) {
				gui.Guide.spiritualize ( sib );
				sib = sibling ( sib );
			}
		});
		return res;
	},

	/**
	 * JQuery replaceAll() and replaceWith().
	 * @TODO Replicate setup in {gui.Guide-_containerspirits} to minimize crawling
	 * @param {$} source
	 * @param {$} target
	 * @param {function} suber
	 */
	_replaceall_replacewith : function ( source, target, suber ) {
		var parent, parents = [], current = [];
		target.each ( function ( i, elm ) {
			gui.Guide.materialize ( elm );
			parent = elm.parentNode;
			if ( parents.indexOf ( parent ) === -1 ) {
				parents.push ( parent );
				current = current.concat ( 
					Array.map ( parent.children, function ( child ) {
						return child;
					})
				);
			}
		});
		var res = suber ();
		parents.forEach ( function ( parent ) {
			if ( parent ) {
				Array.forEach ( parent.children, function ( elm ) {
					if ( current.indexOf ( elm ) === -1 ) {
						gui.Guide.spiritualize ( elm );
					}
				});
			}		
		});
		return res;
	}
	
});