import bluebird from "bluebird";
import get from "lodash.get";
import set from "lodash.set";
import merge from "lodash.merge";
import {Parser} from "web-tree-sitter";

import {Evented} from "utils";
import type {RecursivePartial, AsyncOrSync} from "utils/types";

import {Document, Lang} from "core";

import {Editor} from "ui/editor";

import DirEntries from "base/DirEntries";
import stores, {type Stores} from "base/stores";

import type {Prefs, Theme} from "base/types";

import {generateRequiredLangs} from "./utils";
import {core as langs, astIntel, codeIntel, hiliters} from "./langs";

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

type BaseOptions = {
	useLangs?: boolean;
	prefs?: RecursivePartial<Prefs>;
	init?: () => AsyncOrSync<void>;
};

export default class Base extends Evented<{
	prefsUpdated: void;
	themeUpdated: void;
}> {
	langs = langs();
	astIntel = astIntel();
	codeIntel = codeIntel();
	hiliters = hiliters();
	themes: Record<string, Theme>;
	theme: Theme;
	stores: Stores;
	prefs: Prefs;
	DirEntries = DirEntries;
	
	options: BaseOptions;
	components: Record<string, any>; // TYPE Svelte components
	packageJson = packageJson;
	
	private initialisedLangs = new Set<Lang>();
	
	async init(components, options: BaseOptions = {}) {
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
		
		this.stores.prefs.on("update", (value) => this.updatePrefs(value));
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
	components/utils/themeStyleDev
	*/
	
	modifyThemeForDev(values: RecursivePartial<Theme>): void {
		merge(this.theme, values);
		
		this.fire("themeUpdated");
		
		this.stores.themes.update(this.prefs.theme, this.theme);
	}
	
	async asyncInit() {
		// pre-init common langs
		
		if (this.options.useLangs) {
			await bluebird.map([
				"typescript",
				"html",
				"scss",
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
		
		this.initialisedLangs.add(lang);
	}
	
	async ensureRequiredLangsInitialised(mainLang) {
		await bluebird.map([...generateRequiredLangs(mainLang)], lang => this.initLang(lang));
	}
	
	createEditorForTextArea(string="") {
		return new Editor(Document.fromString(string));
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
	
	getDefaultLang() {
		return this.langs.get(this.prefs.defaultLangCode);
	}
	
	getDefaultPerFilePrefs(document) {
		return {
			wrap: this.getPref("wrap") || this.getPref("defaultWrapLangs").includes(document.lang.code),
		};
	}
}
