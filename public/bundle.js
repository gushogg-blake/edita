
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
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

    let indentRe = /^\s+/gm;

    var normaliseString = function(str) {
    	return str.trim().replace(indentRe, "");
    };

    let {ipcRenderer: ipc} = window.require("electron-better-ipc");


    class PowerShell {
    	constructor(id) {
    		this.id = id;
    		
    		[
    			"addCommand",
    			"invoke",
    		].forEach(m => this[m] = (...args) => this.call(m, ...args));
    	}
    	
    	call(fn, ...args) {
    		return ipc.callMain("powershell/call", [this.id, fn, ...args]);
    	}
    	
    	run(commands) {
    		let lines = normaliseString(commands).split("\n");
    		
    		for (let line of lines) {
    			this.addCommand(line);
    		}
    		
    		return this.invoke();
    	}
    	
    	destroy() {
    		return ipc.callMain("powershell/destroy", [this.id]);
    	}
    }

    var renderer = async function() {
    	return new PowerShell(await ipc.callMain("powershell/create"));
    };

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let h30;
    	let t1;
    	let div0;
    	let form0;
    	let label0;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let br0;
    	let br1;
    	let t4;
    	let button0;
    	let t6;
    	let button1;
    	let t8;
    	let h31;
    	let t10;
    	let div2;
    	let form1;
    	let label1;
    	let input2;
    	let t11;
    	let input3;
    	let t12;
    	let br2;
    	let br3;
    	let t13;
    	let div1;
    	let t14;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h30 = element("h3");
    			h30.textContent = "IE";
    			t1 = space();
    			div0 = element("div");
    			form0 = element("form");
    			label0 = element("label");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "Open";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Close";
    			t8 = space();
    			h31 = element("h3");
    			h31.textContent = "PS";
    			t10 = space();
    			div2 = element("div");
    			form1 = element("form");
    			label1 = element("label");
    			input2 = element("input");
    			t11 = space();
    			input3 = element("input");
    			t12 = space();
    			br2 = element("br");
    			br3 = element("br");
    			t13 = space();
    			div1 = element("div");
    			t14 = text(/*output*/ ctx[2]);
    			add_location(h30, file, 71, 1, 1094);
    			add_location(input0, file, 75, 4, 1183);
    			add_location(label0, file, 74, 3, 1171);
    			attr_dev(input1, "type", "submit");
    			input1.value = "Go";
    			add_location(input1, file, 77, 3, 1223);
    			add_location(form0, file, 73, 2, 1125);
    			add_location(br0, file, 79, 2, 1268);
    			add_location(br1, file, 79, 6, 1272);
    			add_location(button0, file, 80, 2, 1279);
    			add_location(button1, file, 81, 2, 1321);
    			attr_dev(div0, "id", "test");
    			attr_dev(div0, "class", "svelte-8u10tr");
    			add_location(div0, file, 72, 1, 1107);
    			add_location(h31, file, 83, 1, 1372);
    			add_location(input2, file, 87, 4, 1454);
    			add_location(label1, file, 86, 3, 1442);
    			attr_dev(input3, "type", "submit");
    			input3.value = "Run";
    			add_location(input3, file, 89, 3, 1494);
    			add_location(form1, file, 85, 2, 1401);
    			add_location(br2, file, 91, 2, 1540);
    			add_location(br3, file, 91, 6, 1544);
    			attr_dev(div1, "id", "output");
    			attr_dev(div1, "class", "svelte-8u10tr");
    			add_location(div1, file, 92, 2, 1551);
    			attr_dev(div2, "id", "ps");
    			attr_dev(div2, "class", "svelte-8u10tr");
    			add_location(div2, file, 84, 1, 1385);
    			attr_dev(div3, "id", "main");
    			attr_dev(div3, "class", "svelte-8u10tr");
    			add_location(div3, file, 70, 0, 1077);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    				listen_dev(form0, "submit", prevent_default(/*navigate*/ ctx[4]), false, true, false),
    				listen_dev(button0, "click", /*openIe*/ ctx[3], false, false, false),
    				listen_dev(button1, "click", /*closeIe*/ ctx[5], false, false, false),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[10]),
    				listen_dev(form1, "submit", prevent_default(/*run*/ ctx[6]), false, true, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h30);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, form0);
    			append_dev(form0, label0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*url*/ ctx[0]);
    			append_dev(form0, t2);
    			append_dev(form0, input1);
    			append_dev(div0, t3);
    			append_dev(div0, br0);
    			append_dev(div0, br1);
    			append_dev(div0, t4);
    			append_dev(div0, button0);
    			append_dev(div0, t6);
    			append_dev(div0, button1);
    			append_dev(div3, t8);
    			append_dev(div3, h31);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, form1);
    			append_dev(form1, label1);
    			append_dev(label1, input2);
    			set_input_value(input2, /*cmd*/ ctx[1]);
    			append_dev(form1, t11);
    			append_dev(form1, input3);
    			append_dev(div2, t12);
    			append_dev(div2, br2);
    			append_dev(div2, br3);
    			append_dev(div2, t13);
    			append_dev(div2, div1);
    			append_dev(div1, t14);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*url*/ 1 && input0.value !== /*url*/ ctx[0]) {
    				set_input_value(input0, /*url*/ ctx[0]);
    			}

    			if (dirty & /*cmd*/ 2 && input2.value !== /*cmd*/ ctx[1]) {
    				set_input_value(input2, /*cmd*/ ctx[1]);
    			}

    			if (dirty & /*output*/ 4) set_data_dev(t14, /*output*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			run_all(dispose);
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
    	let url = "";
    	let cmd = "";
    	let output = "";
    	let ps;

    	async function openIe() {
    		await ps.run(`
		$ie = new-object -comObject InternetExplorer.Application
		$ie.Visible = $True
	`);
    	}

    	async function navigate() {
    		await ps.run(`
		$ie.Navigate("${url}")
	`);
    	}

    	async function closeIe() {
    		await ps.run(`
		$ie.Quit()
	`);
    	}

    	async function run() {
    		try {
    			$$invalidate(2, output += "\n" + (await ps.run(cmd)));
    		} catch(e) {
    			$$invalidate(2, output += e);
    		}

    		$$invalidate(1, cmd = "");
    	}

    	onMount(async function () {
    		ps = await renderer();
    		console.log(ps);
    	});

    	function input0_input_handler() {
    		url = this.value;
    		$$invalidate(0, url);
    	}

    	function input2_input_handler() {
    		cmd = this.value;
    		$$invalidate(1, cmd);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("fs" in $$props) fs = $$props.fs;
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("cmd" in $$props) $$invalidate(1, cmd = $$props.cmd);
    		if ("output" in $$props) $$invalidate(2, output = $$props.output);
    		if ("ps" in $$props) ps = $$props.ps;
    	};

    	return [
    		url,
    		cmd,
    		output,
    		openIe,
    		navigate,
    		closeIe,
    		run,
    		ps,
    		fs,
    		input0_input_handler,
    		input2_input_handler
    	];
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
