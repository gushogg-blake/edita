import bluebird from "bluebird";
import get from "lodash.get";
import set from "lodash.set";
import merge from "lodash.merge";
import {Parser} from "web-tree-sitter";

import Evented from "utils/Evented";

import getIndentationDetails from "modules/utils/getIndentationDetails";
import guessIndent from "modules/utils/guessIndent";
import checkNewlines from "modules/utils/checkNewlines";
import generateRequiredLangs from "modules/utils/generateRequiredLangs";

import Project from "modules/Project";
import Document from "modules/core/Document";
import Editor from "modules/ui/Editor";
import View from "modules/ui/View";
import DirEntries from "modules/base/DirEntries";
import stores from "modules/stores";
import Lang from "modules/core/Lang";

import javascript from "modules/langs/javascript";
import typescript from "modules/langs/typescript";
import vala from "modules/langs/vala";
import haskell from "modules/langs/haskell";
import tsx from "modules/langs/tsx";
import svelte from "modules/langs/svelte";
import html from "modules/langs/html";
import css from "modules/langs/css";
import scss from "modules/langs/scss";
import php from "modules/langs/php";
import c from "modules/langs/c";
import markdown from "modules/langs/markdown";
import markdown_inline from "modules/langs/markdown_inline";
import cpp from "modules/langs/cpp";
import python from "modules/langs/python";
import ruby from "modules/langs/ruby";
//import codepatterns from "modules/langs/codepatterns";
//import tsq from "modules/langs/tsq";
import prisma from "modules/langs/prisma";
import plaintext from "modules/langs/plaintext";

import Langs from "./Langs";

import packageJson from "root/package.json";

/*
top-level object for general, global things like langs, as well as any
initialisation that needs to be done before any other clientside code runs --
e.g. initialising langs.  this initialisation can be async and is done by
the init() method.

this can be shared between multiple instances of the UI, e.g. with multiple
instances embedded in a web page, so doesn't know anything about the state of
the UI.

lifespan: global singleton created on startup; never destroyed.
*/

class Base extends Evented {
	constructor() {
		super();
		
		this.packageJson = packageJson;
		
		this.langs = new Langs();
		this.initialisedLangs = new Set();
		
		this.DirEntries = DirEntries;
		
		let langs = [
			javascript,
			typescript,
			vala,
			haskell,
			tsx,
			svelte,
			html,
			css,
			scss,
			php,
			markdown,
			markdown_inline,
			c,
			cpp,
			python,
			ruby,
			//codepatterns,
			//tsq,
			prisma,
			plaintext,
		];
		
		for (let lang of langs) {
			this.langs.add(lang);
		}
	}
	
	async init(components, options) {
		options = {
			// lang initialisation can be skipped for e.g. dialogs that don't use editors
			useLangs: true,
			prefs: {},
			init: null,
			...options,
		};
		
		this.components = components;
		this.options = options;
		
		await Promise.all([
			this.initStores(),
			options.useLangs && this.initTreeSitter(),
		]);
		
		await Promise.all([
			this.initPrefs(),
			this.initThemes(),
		]);
		
		this.theme = this.themes[this.prefs.theme];
		
		this.stores.prefs.on("update", (key, prefs) => this.updatePrefs(prefs));
		this.stores.themes.on("update", () => this.updateTheme());
		
		this.setPrefs(options.prefs);
		
		if (options.init) {
			await options.init();
		}
		
		this.asyncInit();
	}
	
	async initStores() {
		this.stores = await stores();
	}
	
	async initPrefs() {
		this.prefs = await this.stores.prefs.load();
	}
	
	async initTreeSitter() {
		await Parser.init({
			locateFile(file) {
				return platform.locateTreeSitterWasm();
			},
		});
	}
	
	updatePrefs(prefs) {
		this.prefs = prefs;
		
		this.updateTheme();
		
		this.fire("prefsUpdated");
	}
	
	async initThemes() {
		this.themes = await this.stores.themes.loadAll();
	}
	
	updateTheme() {
		this.theme = this.themes[this.prefs.theme];
		
		this.fire("themeUpdated");
	}
	
	/*
	enable tweaking theme by changing CSS variables in dev tools. see
	components/themeStyleDev
	*/
	
	modifyThemeForDev(values) {
		merge(this.theme, values);
		
		this.fire("themeUpdated");
		
		this.stores.themes.save(this.prefs.theme, this.theme);
	}
	
	async asyncInit() {
		// pre-init common langs
		
		if (this.options.useLangs) {
			await bluebird.map([
				"javascript",
				"html",
				"css",
				//"php",
				//"c",
				//"cpp",
			], code => this.ensureRequiredLangsInitialised(this.langs.get(code)));
		}
	}
	
	async initLang(lang) {
		if (this.initialisedLangs.has(lang)) {
			return;
		}
		
		if (lang.code !== "plaintext") {
			try {
				await lang.initTreeSitterLanguage();
			} catch (e) {
				console.log("Could not load Tree-sitter language for " + lang.code);
				
				console.error(e);
			}
		}
		
		if (lang.init) {
			lang.init({base: this});
		}
		
		this.initialisedLangs.add(lang);
	}
	
	async ensureRequiredLangsInitialised(mainLang) {
		await bluebird.map([...generateRequiredLangs(mainLang)], lang => this.initLang(lang));
	}
	
	createEditorForTextArea(string="") {
		let document = new Document(string);
		let view = new View(document);
		
		return new Editor(document, view);
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
		
		this.stores.prefs.save(this.prefs);
	}
	
	setPrefs(prefs) {
		Object.assign(this.prefs, prefs);
		
		this.stores.prefs.save(this.prefs);
	}
	
	resetPrefs() {
		this.prefs = this.stores.prefs.defaultValue;
		
		this.stores.prefs.save(this.prefs);
	}
	
	findGlobalKeyComboFor(fn) {
		return Object.entries(this.prefs.globalKeymap).find(([combo, f]) => f === fn)?.[0] || null;
	}
	
	getDefaultPerFilePrefs(document) {
		return {
			wrap: this.getPref("wrap") || this.getPref("defaultWrapLangs").includes(document.lang.code),
		};
	}
}

export default Base;
