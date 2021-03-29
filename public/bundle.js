
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function createLine(string) {
    	return {
    		string,
    		endState: null,
    		cacheKey: null,
    		cachedCommands: {},
    		height: 1,
    	};
    }

    function createLines(code) {
    	return code.split("\n").map(createLine);
    }

    class Document {
    	constructor(code) {
    		this.lines = createLines(code);
    	}
    	
    	/*
    	edit - accepts a starting line index, a number of lines to
    	delete, and a string of code to add (which can contain newlines)
    	*/
    	
    	edit(lineIndex, removeLines, addCode) {
    		
    	}
    }

    var Document_1 = Document;

    let keywords = [
    	"break",
    	"case",
    	"catch",
    	"class",
    	"const",
    	"continue",
    	"debugger",
    	"default",
    	"delete",
    	"do",
    	"else",
    	"enum",
    	"export",
    	"extends",
    	"false",
    	"finally",
    	"for",
    	"function",
    	"if",
    	"import",
    	"in",
    	"instanceof",
    	"let",
    	"new",
    	"null",
    	"return",
    	"static",
    	"super",
    	"switch",
    	"this",
    	"throw",
    	"true",
    	"try",
    	"typeof",
    	"undefined",
    	"var",
    	"void",
    	"while",
    	"with",
    ];

    let re = {
    	startWord: /[a-zA-Z_$]/,
    	word: /[a-zA-Z_$][a-zA-Z_$0-9]*/g,
    	symbol: /[^\s\w]/,
    	startNumber: /(\d|\.\d)/,
    	number: /[.0-9][.0-9E]*/g,
    	regexFlags: /[gmiysu]*/g,
    };

    let states = {
    	DEFAULT: "_",
    	IN_BLOCK_COMMENT: "B",
    	IN_SINGLE_QUOTED_STRING: "S",
    	IN_DOUBLE_QUOTED_STRING: "D",
    	IN_TEMPLATE_STRING: "T",
    };

    let quoteStates = {
    	"'": states.IN_SINGLE_QUOTED_STRING,
    	"\"": states.IN_DOUBLE_QUOTED_STRING,
    };

    /*
    open braces stack - for keeping track of template string interpolations
    (${ switches to  default state and matching } switches back to template string
    state)
    */

    function pushOpenBracesStack(openBracesStack) {
    	return [
    		...(openBracesStack || []),
    		0,
    	];
    }

    function popOpenBracesStack(openBracesStack) {
    	if (openBracesStack.length === 1) {
    		return null;
    	} else {
    		return openBracesStack.slice(0, -1);
    	}
    }

    function peekOpenBracesStack(openBracesStack) {
    	return openBracesStack[openBracesStack.length - 1];
    }

    function incrementOpenBracesStack(openBracesStack) {
    	return [
    		...openBracesStack.slice(0, -1),
    		openBracesStack[openBracesStack.length - 1] + 1,
    	];
    }

    function decrementOpenBracesStack(openBracesStack) {
    	return [
    		...openBracesStack.slice(0, -1),
    		openBracesStack[openBracesStack.length - 1] - 1,
    	];
    }

    /*
    cache key - string representation of the entire state after parsing a line

    this is used to check whether we need to re-parse a line - if a line hasn't
    changed then it only needs re-parsing if the previous line's state has changed
    since we last cached the parse result

    since there are not many different likely end states, we can cache multiple
    results to save time in the common cases, ie. it's likely that slashIsDivision
    and openBracesStack with stay the same and state will toggle between DEFAULT,
    IN_TEMPLATE_STRING, and IN_BLOCK_COMMENT
    */

    function getCacheKey(state, slashIsDivision, openBracesStack) {
    	return (
    		state
    		+ "_"
    		+ Number(slashIsDivision)
    		+ "_"
    		+ (openBracesStack?.join(",") || "")
    	);
    }

    /*
    token codes:

    C - set color
    S - string of text
    B - bracket (B instead of S is used for highlighting matching brackets)
    T - tab
    */

    function convertLineToCommands(
    	prefs,
    	initialState,
    	lineString,
    ) {
    	let {
    		indentWidth,
    	} = prefs;
    	
    	let {
    		state,
    		openBracesStack,
    		slashIsDivision, // for discerning between division and regex literal
    		cacheKey,
    	} = initialState;
    	
    	let commands = [];
    	let i = 0;
    	let col = 0;
    	let ch;
    	
    	while (i < lineString.length) {
    		ch = lineString[i];
    		
    		if (state === states.DEFAULT) {
    			if (ch === "\t") {
    				let tabWidth = (indentWidth - col % indentWidth);
    				
    				commands.push("T" + tabWidth);
    				
    				col += tabWidth;
    				i++;
    			} else if (ch === " ") {
    				commands.push("S ");
    				
    				i++;
    				col++;
    			} else if (ch === "(" || ch === "[" || ch === "{") {
    				commands.push("B" + ch);
    				
    				if (ch === "{" && openBracesStack) {
    					openBracesStack = incrementOpenBracesStack(openBracesStack);
    				}
    				
    				slashIsDivision = false;
    				i++;
    				col++;
    			} else if (ch === ")" || ch === "]" || ch === "}") {
    				commands.push("B" + ch);
    				
    				i++;
    				col++;
    				
    				if (ch === "}") {
    					if (openBracesStack) {
    						openBracesStack = decrementOpenBracesStack(openBracesStack);
    						
    						if (peekOpenBracesStack(openBracesStack) === 0) {
    							openBracesStack = popOpenBracesStack(openBracesStack);
    							
    							state = states.IN_TEMPLATE_STRING;
    						}
    					}
    				}
    				
    				if (state !== states.IN_TEMPLATE_STRING) {
    					slashIsDivision = ch !== "}";
    				}
    				
    				if (state === states.IN_TEMPLATE_STRING) {
    					commands.push("Cstring");
    				}
    			} else if (ch === "\"" || ch === "'") {
    				commands.push("Cstring");
    				commands.push("S" + ch);
    				
    				i++;
    				col++;
    				state = quoteStates[ch];
    			} else if (ch === "`") {
    				commands.push("Cstring");
    				commands.push("S`");
    				
    				i++;
    				col++;
    				state = states.IN_TEMPLATE_STRING;
    			} else if (ch === "/" && lineString[i + 1] === "/") {
    				commands.push("Ccomment");
    				commands.push("S" + lineString.substring(i));
    				
    				slashIsDivision = false;
    				
    				break;
    			} else if (ch === "/" && lineString[i + 1] === "*") {
    				commands.push("Ccomment");
    				commands.push("S/*");
    				
    				i += 2;
    				col += 2;
    				state = states.IN_BLOCK_COMMENT;
    			} else if (ch === "/" && slashIsDivision) {
    				commands.push("Csymbol");
    				commands.push("S" + ch);
    				
    				slashIsDivision = false;
    				i++;
    				col++;
    			} else if (ch === "/" && !slashIsDivision) {
    				commands.push("Cregex");
    				
    				let str = "/";
    				let isEscaped = false;
    				let inClass = false;
    				
    				i++;
    				col++;
    				
    				while (i < lineString.length) {
    					ch = lineString[i];
    					
    					if (ch === "\\") {
    						str += ch;
    						i++;
    						col++;
    						
    						isEscaped = true;
    						
    						continue;
    					} else if (!isEscaped && ch === "[") {
    						inClass = true;
    						
    						str += ch;
    						i++;
    						col++;
    					} else if (!isEscaped && ch === "]") {
    						inClass = false;
    						
    						str += ch;
    						i++;
    						col++;
    					} else if (!isEscaped && !inClass && ch === "/") {
    						str += ch;
    						i++;
    						col++;
    						
    						break;
    					} else if (ch === "\t") {
    						if (str) {
    							commands.push("S" + str);
    						}
    						
    						let tabWidth = (indentWidth - col % indentWidth);
    						
    						commands.push("T" + tabWidth);
    						
    						str = "";
    						col += tabWidth;
    						i++;
    					} else {
    						str += ch;
    						i++;
    						col++;
    					}
    				}
    				
    				re.regexFlags.lastIndex = i;
    				
    				let flags = re.regexFlags.exec(lineString)[0];
    				
    				i += flags.length;
    				col += flags.length;
    				
    				commands.push("S" + str + flags);
    				
    				slashIsDivision = false;
    			} else if (re.startWord.exec(ch)) {
    				re.word.lastIndex = i;
    				
    				let [word] = re.word.exec(lineString);
    				
    				if (keywords.includes(word)) {
    					commands.push("Ckeyword");
    				} else {
    					commands.push("Cid");
    				}
    				
    				commands.push("S" + word);
    				
    				i += word.length;
    				col += word.length;
    				slashIsDivision = true;
    			} else if (re.startNumber.exec(ch)) {
    				re.number.lastIndex = i;
    				
    				let [number] = re.number.exec(lineString);
    				
    				commands.push("Cnumber");
    				commands.push("S" + number);
    				
    				i += number.length;
    				col += number.length;
    				slashIsDivision = true;
    			} else if (re.symbol.exec(ch)) {
    				commands.push("Csymbol");
    				commands.push("S" + ch);
    				
    				i++;
    				col++;
    				slashIsDivision = false;
    			} else {
    				commands.push("Cmisc");
    				commands.push("S" + ch);
    				
    				i++;
    				col++;
    				slashIsDivision = false;
    			}
    		} else if (state === states.IN_BLOCK_COMMENT) {
    			let str = "";
    			let isClosed = false;
    					
    			while (i < lineString.length) {
    				ch = lineString[i];
    				
    				if (ch === "\t") {
    					if (str) {
    						commands.push("S" + str);
    					}
    					
    					let tabWidth = (indentWidth - col % indentWidth);
    					
    					commands.push("T" + tabWidth);
    					
    					str = "";
    					col += tabWidth;
    					i++;
    				} else if (ch === "*" && lineString[i + 1] === "/") {
    					str += "*/";
    					i += 2;
    					col += 2;
    					
    					isClosed = true;
    						
    					break;
    				} else {
    					str += ch;
    					i++;
    					col++;
    				}
    			}
    			
    			if (str) {
    				commands.push("S" + str);
    			}
    			
    			if (isClosed) {
    				state = states.DEFAULT;
    			}
    		} else if (
    			state === states.IN_SINGLE_QUOTED_STRING
    			|| state === states.IN_DOUBLE_QUOTED_STRING
    		) {
    			let quote = state === states.IN_SINGLE_QUOTED_STRING ? "'" : "\"";
    			let isEscaped = false;
    			let isClosed = false;
    			let str = "";
    					
    			while (i < lineString.length) {
    				ch = lineString[i];
    				
    				if (ch === "\\") {
    					str += ch;
    					i++;
    					col++;
    					
    					isEscaped = true;
    					
    					continue;
    				} else if (ch === "\t") {
    					if (str) {
    						commands.push("S" + str);
    					}
    					
    					let tabWidth = (indentWidth - col % indentWidth);
    					
    					commands.push("T" + tabWidth);
    					
    					str = "";
    					col += tabWidth;
    					i++;
    				} else if (ch === quote) {
    					str += ch;
    					i++;
    					col++;
    					
    					if (!isEscaped) {
    						isClosed = true;
    						
    						break;
    					}
    				} else {
    					str += ch;
    					i++;
    					col++;
    				}
    				
    				isEscaped = false;
    			}
    			
    			if (str) {
    				commands.push("S" + str);
    			}
    			
    			if (!isClosed && !isEscaped) {
    				commands.push("EnoClosingQuote");
    			}
    			
    			if (!isEscaped) {
    				state = states.DEFAULT;
    			}
    		} else if (state === states.IN_TEMPLATE_STRING) {
    			let isEscaped = false;
    			let isClosed = false;
    			let str = "";
    					
    			while (i < lineString.length) {
    				ch = lineString[i];
    				
    				if (ch === "\\") {
    					str += ch;
    					i++;
    					col++;
    					
    					isEscaped = true;
    					
    					continue;
    				} else if (ch === "\t") {
    					if (str) {
    						commands.push("S" + str);
    					}
    					
    					let tabWidth = (indentWidth - col % indentWidth);
    					
    					commands.push("T" + tabWidth);
    					
    					str = "";
    					col += tabWidth;
    					i++;
    				} else if (ch === "`") {
    					str += ch;
    					i++;
    					col++;
    					
    					if (!isEscaped) {
    						isClosed = true;
    						
    						break;
    					}
    				} else if (!isEscaped && ch === "$" && lineString[i + 1] === "{") {
    					commands.push("S" + str);
    					
    					str = "";
    					
    					openBracesStack = pushOpenBracesStack(openBracesStack);
    					
    					isClosed = true;
    					
    					break;
    				} else {
    					str += ch;
    					i++;
    					col++;
    				}
    				
    				isEscaped = false;
    			}
    			
    			if (str) {
    				commands.push("S" + str);
    			}
    			
    			if (isClosed) {
    				state = states.DEFAULT;
    			}
    		}
    	}
    	
    	let endState = {
    		state,
    		slashIsDivision,
    		openBracesStack,
    		cacheKey: getCacheKey(state, slashIsDivision, openBracesStack),
    	};
    	
    	return {
    		commands,
    		endState,
    	};
    }

    var js = function(
    	prefs,
    	lines,
    	startIndex=0,
    	endIndex=null,
    ) {
    	if (endIndex === null) {
    		endIndex = lines.length - 1;
    	}
    	
    	let prevState = startIndex > 0 ? lines[startIndex - 1].endState : {
    		state: states.DEFAULT,
    		slashIsDivision: false,
    		openBracesStack: null,
    		cacheKey: getCacheKey(states.DEFAULT, false, null),
    	};
    	
    	for (let lineIndex = startIndex; lineIndex <= endIndex; lineIndex++) {
    		let line = lines[lineIndex];
    		
    		let {
    			commands,
    			endState,
    		} = convertLineToCommands(
    			prefs,
    			prevState,
    			line.string,
    		);
    		
    		line.commands = commands;
    		line.endState = endState;
    		
    		prevState = endState;
    	}
    };

    var marginStyle = {
    	margin: 1,
    	paddingLeft: 3,
    	paddingRight: 5,
    };

    let {paddingLeft: paddingLeft$1, paddingRight: paddingRight$1} = marginStyle;

    var calculateMarginWidth = function(lines, measurements) {
    	return paddingLeft$1 + String(lines.length).length * measurements.colWidth + paddingRight$1;
    };

    var renderMarginBackground = function(
    	context,
    	lines,
    	prefs,
    	measurements,
    ) {
    	let {height} = context.canvas;
    	
    	context.fillStyle = prefs.marginBackground;
    	context.fillRect(0, 0, calculateMarginWidth(lines, measurements), height);
    };

    let {paddingLeft, paddingRight, margin: margin$1} = marginStyle;

    var calculateMarginOffset = function(lines, measurements) {
    	return paddingLeft + String(lines.length).length * measurements.colWidth + paddingRight + margin$1;
    };

    var findFirstVisibleLine = function(lines, scrollPosition) {
    	let row = 0;
    	
    	for (let i = 0; i < lines.length; i++) {
    		let line = lines[i];
    		
    		if (row + line.height > scrollPosition.row) {
    			return {
    				line,
    				lineIndex: i,
    				wrappedLineIndex: scrollPosition.row - row,
    			};
    		}
    		
    		row += line.height;
    	}
    	
    	return null;
    };

    var renderCodeAndMargin = function(
    	context,
    	lines,
    	selection,
    	scrollPosition,
    	prefs,
    	colors,
    	measurements,
    ) {
    	context.font = prefs.font;
    	
    	let {
    		colWidth,
    		rowHeight,
    	} = measurements;
    	
    	let {
    		width,
    		height,
    	} = context.canvas;
    	
    	let rowsToRender = height / rowHeight;
    	let rowsRendered = 0;
    	
    	let marginWidth = calculateMarginWidth(lines, measurements);
    	let marginOffset = calculateMarginOffset(lines, measurements);
    	let leftEdge = marginOffset - scrollPosition.col * colWidth;
    	
    	// Code & margin
    	
    	let x = 0;
    	let y = rowHeight; // not 0 -- we're using textBaseline="bottom"
    	
    	let {
    		lineIndex,
    		wrappedLineIndex,
    	} = findFirstVisibleLine(lines, scrollPosition);
    	
    	while (true) {
    		let line = lines[lineIndex];
    		
    		// code
    		
    		for (let i = 0; i < line.height; i++) {
    			line.height === 1 ? line.commands : line.wrappedLines[i].commands;
    			
    			for (let command of line.commands) {
    				let [type, value] = [command.charAt(0), command.substr(1)];
    				
    				if (type === "S") {
    					context.fillText(value, x, y);
    					
    					x += value.length * colWidth;
    				} else if (type === "B") {
    					context.fillStyle = colors.symbol;
    					context.fillText(value, x, y);
    					
    					x += colWidth;
    				} else if (type === "C") {
    					context.fillStyle = colors[value];
    				} else if (type === "T") {
    					let width = Number(value);
    					
    					context.fillText(" ".repeat(width), x, y);
    					
    					x += width * colWidth;
    				}
    			}
    			
    			rowsRendered++;
    			x = leftEdge;
    			y += rowHeight;
    		}
    		
    		// margin background
    		// rendered after code so that it covers it if code is scrolled horizontally
    		
    		let marginHeight = line.height * rowHeight;
    		
    		context.fillStyle = "#f0f0f0";
    		context.fillRect(0, y - marginHeight, marginWidth, marginHeight);
    		
    		// line number
    		
    		let lineNumber = String(lineIndex + 1);
    		
    		context.fillText(
    			lineNumber,
    			marginWidth - marginStyle.paddingRight - lineNumber.length * colWidth,
    			y - marginHeight + rowHeight,
    		);
    		
    		// TODO folding
    		
    		if (rowsRendered >= rowsToRender) {
    			break;
    		}
    		
    		lineIndex++;
    		
    		if (lineIndex === lines.length) {
    			break;
    		}
    	}
    };

    //let renderCurrentLineHilite = require("./renderCurrentLineHilite");
    //let renderSelection = require("./renderSelection");
    //let renderWordHilites = require("./renderWordHilites");

    //let renderCursor = require("./renderCursor");

    var render = function(
    	context,
    	lines,
    	selection,
    	hiliteWord,
    	scrollPosition,
    	prefs,
    	colors,
    	measurements,
    	cursorBlinkOn,
    ) {
    	console.time("render");
    	
    	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    	
    	renderMarginBackground(
    		context,
    		lines,
    		prefs,
    		measurements,
    	);
    	
    	//renderCurrentLineHilite(
    	//	context,
    	//	lines,
    	//	selection,
    	//	scrollPosition,
    	//	colors,
    	//	measurements,
    	//);
    	
    	//renderSelection(
    	//	context,
    	//	lines,
    	//	selection,
    	//	scrollPosition,
    	//	colors,
    	//	measurements,
    	//);
    	
    	//renderWordHilites(
    	//	context,
    	//	lines,
    	//	selection,
    	//	scrollPosition,
    	//	colors,
    	//	measurements,
    	//);
    	
    	renderCodeAndMargin(
    		context,
    		lines,
    		selection,
    		scrollPosition,
    		prefs,
    		colors,
    		measurements,
    	);
    	
    	//renderCursor(
    	//	context,
    	//	lines,
    	//	selection,
    	//	scrollPosition,
    	//	measurements,
    	//	cursorBlinkOn,
    	//);
    	
    	console.timeEnd("render");
    };

    var _typeof = v => ({}).toString.call(v).slice(8, -1);

    function reduce(acc, val) {
    	if (_typeof(val) === "Array") {
    		return [...acc, ...flatten(val)];
    	} else {
    		return [...acc, val];
    	}
    }

    function flatten(array) {
    	return array.reduce(reduce, []);
    }

    var flatten_1 = flatten;

    var camelToKebab = function(str) {
    	return str.replace(/([A-Z])/g, (_, ch) => "-" + ch.toLowerCase());
    };

    let nonSizeProps = [
    	"opacity",
    	"flex-grow",
    	"font-weight",
    ];

    var inlineStyle = function(...styles) {
    	let all = Object.assign({}, ...flatten_1(styles));
    	let str = "";
    	
    	for (let k in all) {
    		let prop = camelToKebab(k);
    		let value = all[k];
    		
    		if (typeof value === "number" && value !== 0 && !nonSizeProps.includes(prop)) {
    			value += "px";
    		}
    		
    		if (value !== undefined) {
    			str += prop + ": " + value + ";";
    		}
    	}
    	
    	return str;
    };

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var arrayMethods = createCommonjsModule(function (module) {
    module.exports = {
    	splice(array, ...args) {
    		return module.exports.spliceInPlace(array.slice(), ...args);
    	},
    	
    	push(array, ...elements) {
    		return [...array, ...elements];
    	},
    	
    	add(array, ...elements) {
    		return [...array, ...elements.filter(e => !array.includes(e))];
    	},
    	
    	pop(array) {
    		return array.slice(0, array.length - 1);
    	},
    	
    	shift(array) {
    		return array.slice(1);
    	},
    	
    	unshift(array, ...elements) {
    		return [...elements, ...array];
    	},
    	
    	remove(array, item) {
    		return array.filter(_item => _item !== item);
    	},
    	
    	sort(array, comparator) {
    		return array.slice().sort(comparator);
    	},
    	
    	reverse(array, comparator) {
    		return array.slice().reverse();
    	},
    	
    	spliceInPlace(array, i, deleteElements, ...insertElements) {
    		array.splice(i, deleteElements, ...insertElements);
    		
    		return array;
    	},
    	
    	pushInPlace(array, ...elements) {
    		array.push(...elements);
    		
    		return array;
    	},
    	
    	addInPlace(array, ...elements) {
    		for (let e of elements) {
    			if (!array.includes(e)) {
    				array.push(e);
    			}
    		}
    	},
    	
    	popInPlace(array) {
    		array.pop();
    		
    		return array;
    	},
    	
    	shiftInPlace(array) {
    		array.shift();
    		
    		return array;
    	},
    	
    	unshiftInPlace(array, elements) {
    		array.unshift(elements);
    		
    		return array;
    	},
    	
    	removeInPlace(array, item) {
    		let index;
    		
    		while ((index = array.indexOf(item)) !== -1) {
    			array.splice(index, 1);
    		}
    		
    		return array;
    	},
    	
    	sortInPlace(array, comparator) {
    		array.sort(comparator);
    		
    		return array;
    	},
    	
    	reverseInPlace(array) {
    		array.reverse();
    		
    		return array;
    	},
    };
    });
    arrayMethods.splice;
    arrayMethods.push;
    arrayMethods.add;
    arrayMethods.pop;
    arrayMethods.shift;
    arrayMethods.unshift;
    arrayMethods.remove;
    arrayMethods.sort;
    arrayMethods.reverse;
    arrayMethods.spliceInPlace;
    arrayMethods.pushInPlace;
    arrayMethods.addInPlace;
    arrayMethods.popInPlace;
    arrayMethods.shiftInPlace;
    arrayMethods.unshiftInPlace;
    arrayMethods.removeInPlace;
    arrayMethods.sortInPlace;
    arrayMethods.reverseInPlace;

    let {removeInPlace} = arrayMethods;

    var Store = class {
    	constructor(value) {
    		this.value = value;
    		this.handlers = [];
    	}
    	
    	subscribe(handler) {
    		this.handlers.push(handler);
    		
    		handler(this.value);
    		
    		return () => {
    			removeInPlace(this.handlers, handler);
    		}
    	}
    };

    var Writable = class extends Store {
    	constructor(value) {
    		super(value);
    	}
    	
    	set(value) {
    		this.value = value;
    		
    		for (let handler of this.handlers) {
    			handler(value);
    		}
    	}
    };

    var LocalStorage = class extends Writable {
    	constructor(key, value, version, migrate) {
    		let existingValue;
    		
    		try {
    			let existing = JSON.parse(localStorage.getItem(key));
    			
    			if (existing.version && (!version || existing.version === version)) {
    				existingValue = existing.value;
    			} else if (migrate && migrate[existing.version]) {
    				existingValue = migrate[existing.version](existing.value);
    			} else if (migrate && migrate["*"]) {
    				existingValue = migrate["*"](existing.value);
    			} else {
    				existingValue = null;
    			}
    		} catch (e) {
    			existingValue = null;
    			
    			localStorage.setItem(key, "null");
    		}
    		
    		value = existingValue || value;
    		
    		super(value);
    		
    		this.version = version;
    		this.key = key;
    		this._store();
    	}
    	
    	_store() {
    		localStorage.setItem(this.key, JSON.stringify({
    			version: this.version || "1",
    			value: this.value,
    		}));
    	}
    	
    	set(value) {
    		super.set(value);
    		
    		this._store();
    	}
    	
    	update(obj) {
    		this.set({
    			...this.value,
    			...obj,
    		});
    	}
    	
    	clear() {
    		localStorage.removeItem(this.key);
    	}
    };

    var prefs = new LocalStorage("prefs", {
    	font: "14px DejaVu Sans Mono",
    	indentWidth: 4,
    	lineNumberColor: "#9f9f9f",
    	marginBackground: "#f0f0f0",
    	
    	langs: {
    		js: {
    			colors: {
    				keyword: "#aa33aa",
    				id:  "#202020",
    				comment: "#7f7f7f",
    				symbol: "#bb22bb",
    				number: "#cc2222",
    				string: "#2233bb",
    				regex: "#cc7030",
    			},
    		},
    	},
    });

    /* src/components/Editor.svelte generated by Svelte v3.16.7 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/Editor.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let canvas_1;
    	let canvas_1_style_value;
    	let t;
    	let div1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			canvas_1 = element("canvas");
    			t = space();
    			div1 = element("div");
    			attr_dev(canvas_1, "style", canvas_1_style_value = inlineStyle(/*canvasStyle*/ ctx[3]));
    			add_location(canvas_1, file$1, 170, 1, 3597);
    			attr_dev(div0, "id", "main");
    			attr_dev(div0, "class", "svelte-14ao8hw");
    			add_location(div0, file$1, 165, 0, 3542);
    			attr_dev(div1, "id", "measurements");
    			attr_dev(div1, "class", "svelte-14ao8hw");
    			add_location(div1, file$1, 179, 0, 3750);

    			dispose = [
    				listen_dev(window, "resize", /*resize*/ ctx[6], false, false, false),
    				listen_dev(canvas_1, "mousedown", /*mousedown*/ ctx[4], false, false, false),
    				listen_dev(canvas_1, "mouseup", mouseup, false, false, false),
    				listen_dev(canvas_1, "mousemove", mousemove, false, false, false),
    				listen_dev(div0, "wheel", /*wheel*/ ctx[5], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, canvas_1);
    			/*canvas_1_binding*/ ctx[18](canvas_1);
    			/*div0_binding*/ ctx[19](div0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			/*div1_binding*/ ctx[20](div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*canvasStyle*/ 8 && canvas_1_style_value !== (canvas_1_style_value = inlineStyle(/*canvasStyle*/ ctx[3]))) {
    				attr_dev(canvas_1, "style", canvas_1_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			/*canvas_1_binding*/ ctx[18](null);
    			/*div0_binding*/ ctx[19](null);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			/*div1_binding*/ ctx[20](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function mousemove(e) {
    	
    }

    function mouseup(e) {
    	
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $prefs;
    	validate_store(prefs, "prefs");
    	component_subscribe($$self, prefs, $$value => $$invalidate(12, $prefs = $$value));
    	let { document } = $$props;
    	let { lang } = $$props;
    	let main;
    	let measurementsDiv;
    	let canvas;
    	let context;
    	let measurements;
    	let coordsXHint = 2;
    	let selection = { start: [0, 0], end: [0, 0] };
    	let scrollPosition = { row: 0, col: 0 };
    	let hiliteWord = null;

    	function mousedown(e) {
    		let { colWidth, rowHeight } = measurements;
    		let { x: left, y: top } = canvas.getBoundingClientRect();
    		calculateMarginOffset(document.lines, measurements);
    		let x = e.clientX - left - margin.widthPlusGap + scrollPosition.col + coordsXHint;
    		let y = e.clientY - top;
    		let cursorCol = Math.round(x / colWidth);
    		let screenLine = Math.floor(y / rowHeight);
    		console.log(screenLine, cursorCol);
    	}

    	function wheel(e) {
    		let dir = e.deltaY > 0 ? 1 : -1;

    		if (e.shiftKey) {
    			let newCol = Math.round(scrollPosition.col + measurements.colWidth * 3 * dir);
    			newCol = Math.max(0, newCol);
    			scrollPosition.col = newCol;
    		} else {
    			let newRow = scrollPosition.row + 3 * dir;
    			newRow = Math.max(0, newRow);
    			scrollPosition.row = newRow;
    		}

    		redraw();
    	}

    	function resize() {
    		$$invalidate(2, canvas.width = main.offsetWidth, canvas);
    		$$invalidate(2, canvas.height = main.offsetHeight, canvas);
    		context.textBaseline = "bottom";
    		redraw();
    	}

    	function redraw() {
    		render(context, document.lines, selection, hiliteWord, scrollPosition, $prefs.font, $prefs.langs[lang].colors, measurements);
    	}

    	function updateMeasurements() {
    		$$invalidate(1, measurementsDiv.style = inlineStyle({ font: prefs.font }), measurementsDiv);
    		$$invalidate(1, measurementsDiv.innerHTML = ("A").repeat(100), measurementsDiv);

    		measurements = {
    			colWidth: measurementsDiv.offsetWidth / measurementsDiv.innerHTML.length,
    			rowHeight: measurementsDiv.offsetHeight
    		};
    	}

    	onMount(async function () {
    		context = canvas.getContext("2d");
    		js($prefs, document.lines);
    		updateMeasurements();
    		resize();
    		redraw();
    	});

    	const writable_props = ["document", "lang"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, canvas = $$value);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, main = $$value);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, measurementsDiv = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("document" in $$props) $$invalidate(7, document = $$props.document);
    		if ("lang" in $$props) $$invalidate(8, lang = $$props.lang);
    	};

    	$$self.$capture_state = () => {
    		return {
    			document,
    			lang,
    			main,
    			measurementsDiv,
    			canvas,
    			context,
    			measurements,
    			coordsXHint,
    			selection,
    			scrollPosition,
    			hiliteWord,
    			$prefs,
    			canvasStyle
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("document" in $$props) $$invalidate(7, document = $$props.document);
    		if ("lang" in $$props) $$invalidate(8, lang = $$props.lang);
    		if ("main" in $$props) $$invalidate(0, main = $$props.main);
    		if ("measurementsDiv" in $$props) $$invalidate(1, measurementsDiv = $$props.measurementsDiv);
    		if ("canvas" in $$props) $$invalidate(2, canvas = $$props.canvas);
    		if ("context" in $$props) context = $$props.context;
    		if ("measurements" in $$props) measurements = $$props.measurements;
    		if ("coordsXHint" in $$props) coordsXHint = $$props.coordsXHint;
    		if ("selection" in $$props) selection = $$props.selection;
    		if ("scrollPosition" in $$props) scrollPosition = $$props.scrollPosition;
    		if ("hiliteWord" in $$props) hiliteWord = $$props.hiliteWord;
    		if ("$prefs" in $$props) prefs.set($prefs = $$props.$prefs);
    		if ("canvasStyle" in $$props) $$invalidate(3, canvasStyle = $$props.canvasStyle);
    	};

    	let canvasStyle;
    	$$invalidate(3, canvasStyle = { cursor: "text" });

    	return [
    		main,
    		measurementsDiv,
    		canvas,
    		canvasStyle,
    		mousedown,
    		wheel,
    		resize,
    		document,
    		lang,
    		context,
    		measurements,
    		scrollPosition,
    		$prefs,
    		coordsXHint,
    		selection,
    		hiliteWord,
    		redraw,
    		updateMeasurements,
    		canvas_1_binding,
    		div0_binding,
    		div1_binding
    	];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { document: 7, lang: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*document*/ ctx[7] === undefined && !("document" in props)) {
    			console_1.warn("<Editor> was created without expected prop 'document'");
    		}

    		if (/*lang*/ ctx[8] === undefined && !("lang" in props)) {
    			console_1.warn("<Editor> was created without expected prop 'lang'");
    		}
    	}

    	get document() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set document(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lang() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lang(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file = "src/App.svelte";

    // (27:1) {#if document}
    function create_if_block(ctx) {
    	let current;

    	const editor = new Editor({
    			props: {
    				document: /*document*/ ctx[0],
    				lang: "js"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(editor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editor, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const editor_changes = {};
    			if (dirty & /*document*/ 1) editor_changes.document = /*document*/ ctx[0];
    			editor.$set(editor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(27:1) {#if document}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let current;
    	let if_block = /*document*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "id", "main");
    			attr_dev(div, "class", "svelte-5h8m80");
    			add_location(div, file, 25, 0, 572);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*document*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let fs = require("flowfs");
    	let document;

    	onMount(async function () {
    		let code = await fs("test/repos/bluebird/js/browser/bluebird.js").read();
    		$$invalidate(0, document = new Document_1(code));
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("fs" in $$props) fs = $$props.fs;
    		if ("document" in $$props) $$invalidate(0, document = $$props.document);
    	};

    	return [document];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    // HACK for https://github.com/sindresorhus/electron-better-ipc/issues/35
    require("electron").ipcRenderer.addListener("fix-event-79558e00-29ef-5c7f-84bd-0bcd9a0c5cf3", () => {});

    let app = new App({
    	target: document.body,
    });

    window.app = app;

    return app;

}());
//# sourceMappingURL=bundle.js.map
