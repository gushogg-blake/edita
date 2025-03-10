let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");
let merge = require("lodash.merge");

let Evented = require("utils/Evented");

let getIndentationDetails = require("modules/utils/getIndentationDetails");
let guessIndent = require("modules/utils/guessIndent");
let checkNewlines = require("modules/utils/checkNewlines");
let generateRequiredLangs = require("modules/utils/generateRequiredLangs");

let Project = require("modules/Project");
let Document = require("modules/Document");
let Editor = require("modules/Editor");
let View = require("modules/View");
let DirEntries = require("modules/DirEntries");
let stores = require("modules/stores");
let Lang = require("modules/Lang");

let javascript = require("modules/langs/javascript");
let typescript = require("modules/langs/typescript");
let vala = require("modules/langs/vala");
let haskell = require("modules/langs/haskell");
let tsx = require("modules/langs/tsx");
let svelte = require("modules/langs/svelte");
let html = require("modules/langs/html");
let css = require("modules/langs/css");
let scss = require("modules/langs/scss");
let php = require("modules/langs/php");
let c = require("modules/langs/c");
let markdown = require("modules/langs/markdown");
let markdown_inline = require("modules/langs/markdown_inline");
let cpp = require("modules/langs/cpp");
let python = require("modules/langs/python");
let ruby = require("modules/langs/ruby");
//let codepatterns = require("modules/langs/codepatterns");
//let tsq = require("modules/langs/tsq");
let prisma = require("modules/langs/prisma");
let plaintext = require("modules/langs/plaintext");

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

class Langs {
	constructor() {
		this.langs = {};
		this.assignedAccelerators = new Set();
	}
	
	add(langModule) {
		let lang = new Lang(langModule);
		
		this.assignAccelerator(lang);
		
		this.langs[lang.code] = lang;
	}
	
	// assign accelerators on a first-come, first-served basis
	// this means langs should probably be listed in order of
	// most used. (currently this is not per-user configurable).
	// NOTE this seems to be not as good as just letting the
	// platform handle it, as linux at least cycles between options
	// if multiple labels begin with the same letter - turning
	// off for now (see components/App/Toolbar.svelte)
	
	assignAccelerator(lang) {
		let {name} = lang;
		
		lang.accelerator = name;
		
		for (let i = 0; i < name.length; i++) {
			let ch = name[i];
			
			if (this.assignedAccelerators.has(ch.toLowerCase())) {
				continue;
			}
			
			lang.accelerator = name.substr(0, i) + "&" + name.substr(i);
			
			this.assignedAccelerators.add(ch.toLowerCase());
			
			break;
		}
	}
	
	get(code) {
		return this.langs[code] || null;
	}
	
	get all() {
		return Object.values(this.langs);
	}
}

class Base extends Evented {
	constructor() {
		super();
		
		this.packageJson = require("root/package.json");
		
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
		await TreeSitter.init({
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
	
	/*
	There are 3 support levels: general and specific, and alternate.
	
	general means the lang supports the file, and should be used unless there is
	a lang with specific support.
	
	specific means the file can be handled by a general lang, but this lang has
	more specific support, e.g. Node vs JavaScript.  Languages should only return
	"specific" if there is a specific reason to, and specific langs that can also
	handle the general lang should return "alternate" for those files.  Node
	should return "specific" for .js files that are identifiable as Node files
	(e.g. they have a Node hashbang line); alternate for .js files that aren't
	identifiable as Node files; and null for anything else.
	
	alternate means the lang supports the file but wouldn't usually be used,
	e.g. JavaScript supports JSON files and SCSS supports CSS files.
	*/
	
	guessLang(code, url) {
		if (url) {
			for (let [langCode, patterns] of Object.entries(base.prefs.fileAssociations)) {
				for (let pattern of patterns) {
					if (platform.fs(url.path).matchName(pattern)) {
						return this.langs.get(langCode);
					}
				}
			}
		}
		
		let general = null;
		let alternate = null;
		let fallback = this.langs.get("plaintext");
		
		for (let lang of this.langs.all.filter(lang => lang !== fallback)) {
			let supportLevel = lang.getSupportLevel(code, url?.path);
			
			if (supportLevel === "specific") {
				return lang;
			} else if (supportLevel === "general" && !general) {
				general = lang;
			} else if (supportLevel === "alternate" && !alternate) {
				alternate = lang;
			}
		}
		
		return general || alternate || fallback;
	}
	
	getFormat(code, url) {
		let {
			defaultIndent,
			tabWidth,
			defaultNewline,
		} = this.prefs;
		
		let indent = guessIndent(code) || defaultIndent;
		let lang = this.guessLang(code, url);
		
		let {
			mixed: hasMixedNewlines,
			mostCommon: newline,
		} = checkNewlines(code);
		
		if (!newline) {
			newline = defaultNewline;
		}
		
		let indentation = getIndentationDetails(indent, tabWidth);
		
		return {
			indentation,
			tabWidth,
			lang,
			newline,
			hasMixedNewlines,
		};
	}
	
	getDefaultFormat(lang=null) {
		let {
			defaultIndent,
			tabWidth,
			defaultNewline,
			defaultLangCode,
		} = this.prefs;
		
		if (!lang) {
			lang = this.langs.get(defaultLangCode);
		}
		
		let indentation = getIndentationDetails(defaultIndent, tabWidth);
		
		return {
			indentation,
			tabWidth,
			lang,
			newline: defaultNewline,
			hasMixedNewlines: false,
		};
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
}

module.exports = Base;
