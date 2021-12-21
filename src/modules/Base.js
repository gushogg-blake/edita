let bluebird = require("bluebird");

let getIndentationDetails = require("modules/utils/getIndentationDetails");
let guessIndent = require("modules/utils/guessIndent");
let checkNewlines = require("modules/utils/checkNewlines");

let Document = require("modules/Document");
let Editor = require("modules/Editor");
let View = require("modules/View");

let DirEntries = require("modules/DirEntries");
let langs = require("modules/langs");
let LspContext = require("modules/lsp/LspContext");

let javascript = require("modules/langs/javascript");
let html = require("modules/langs/html");
let css = require("modules/langs/css");
let scss = require("modules/langs/scss");
let php = require("modules/langs/php");
let c = require("modules/langs/c");
let cpp = require("modules/langs/cpp");
let python = require("modules/langs/python");
let svelte = require("modules/langs/svelte");
let plainText = require("modules/langs/plainText");

/*
top-level object for general, global things like langs, as well as any
initialisation that needs to be done before any other clientside code runs --
e.g. initialising langs.  this initialisation can be async and is done by
the init() method.

this can be shared between multiple instances of the UI, e.g. with multiple
instances embedded in a web page, so doesn't know anything about the state of
the UI.
*/

class Base {
	constructor() {
		this.langs = langs;
		this.treeSitterLanguages = {};
		this.initialisedLangs = new Set();
		
		this.lspContext = new LspContext();
		
		this.DirEntries = DirEntries;
	}
	
	async init(components) {
		this.components = components;
		
		await TreeSitter.init();
		
		let langs = [
			javascript,
			svelte,
			html,
			css,
			scss,
			php,
			c,
			cpp,
			python,
			plainText,
		];
		
		for (let lang of langs) {
			this.langs.add(lang);
		}
		
		this.asyncInit();
	}
	
	async asyncInit() {
		// pre-init common langs
		
		await bluebird.map([
			"javascript",
			"html",
			"css",
			//"php",
			//"c",
			//"cpp",
		], code => this.initLanguage(this.langs.get(code)));
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
			for (let [langCode, patterns] of Object.entries(platform.prefs.fileAssociations)) {
				for (let pattern of patterns) {
					if (platform.fs(url.path).matchName(pattern)) {
						return this.langs.get(langCode);
					}
				}
			}
		}
		
		let general = null;
		let alternate = null;
		let fallback = this.langs.get("plainText");
		
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
	
	getFileDetails(code, url) {
		let {
			defaultIndent,
			tabWidth,
			defaultNewline,
		} = platform.prefs;
		
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
	
	getDefaultFileDetails(lang=null) {
		let {
			defaultIndent,
			tabWidth,
			defaultNewline,
			defaultLangCode,
		} = platform.prefs;
		
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
	
	getTreeSitterLanguage(code) {
		return this.treeSitterLanguages[code];
	}
	
	async initLanguage(lang) {
		if (this.initialisedLangs.has(lang) || lang.code === "plainText") {
			return;
		}
		
		let {code} = lang;
		let treeSitterLanguage = await platform.loadTreeSitterLanguage(code);
		
		this.treeSitterLanguages[code] = treeSitterLanguage;
		
		lang.injections = (lang.injections || []).map((injection) => {
			return {
				...injection,
				query: treeSitterLanguage.query(injection.pattern),
			};
		});
		
		this.initialisedLangs.add(lang);
	}
	
	createEditorForTextArea(string="") {
		let document = new Document(string);
		let view = new View(document);
		
		return new Editor(document, view);
	}
}

module.exports = Base;
