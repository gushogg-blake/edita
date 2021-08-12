let minimatch = require("minimatch");

let Evented = require("../../../utils/Evented");

let getIndentationDetails = require("../../../modules/utils/getIndentationDetails");
let guessIndent = require("../../../modules/utils/guessIndent");
let checkNewlines = require("../../../modules/utils/checkNewlines");

let javascript = require("../../../modules/langs/javascript");
let html = require("../../../modules/langs/html");
//let svelte = require("../../../modules/langs/svelte");
let plainText = require("../../../modules/langs/plainText");
let langs = require("../../../modules/langs");

function defaultPrefs() {
	return {
		font: "14px DejaVu Sans Mono",
		
		tabWidth: 4,
		defaultIndent: "\t",
		defaultNewline: platform.systemInfo.newline,
		defaultLang: "javascript",
		
		lineNumberColor: "#9f9f9f",
		marginBackground: "#f0f0f0",
		selectionBackground: "#d0d0d0",
		hiliteBackground: "#fdee20",
		astSelectionBackground: "#c5e4ff",
		astSelectionHiliteBackground: "#F2F2F2",
		astInsertionHiliteBackground: "#606060",
		
		wrap: false,
		
		modeSwitchKey: "Escape",
		minHoldTime: 200,
		
		normalKeymap: {
			"ArrowUp": "up",
			"ArrowDown": "down",
			"ArrowLeft": "left",
			"ArrowRight": "right",
			"PageUp": "pageUp",
			"PageDown": "pageDown",
			"End": "end",
			"Home": "home",
			"Ctrl+ArrowLeft": "wordLeft",
			"Ctrl+ArrowRight": "wordRight",
			"Shift+ArrowUp": "expandOrContractSelectionUp",
			"Shift+ArrowDown": "expandOrContractSelectionDown",
			"Shift+ArrowLeft": "expandOrContractSelectionLeft",
			"Shift+ArrowRight": "expandOrContractSelectionRight",
			"Shift+PageUp": "expandOrContractSelectionPageUp",
			"Shift+PageDown": "expandOrContractSelectionPageDown",
			"Shift+End": "expandOrContractSelectionEnd",
			"Shift+Home": "expandOrContractSelectionHome",
			"Ctrl+Shift+ArrowLeft": "expandOrContractSelectionWordLeft",
			"Ctrl+Shift+ArrowRight": "expandOrContractSelectionWordRight",
			"Backspace": "backspace",
			"Delete": "delete",
			"Enter": "enter",
			"Tab": "tab",
			"Shift+Backspace": "backspace",
			"Shift+Delete": "delete",
			"Shift+Enter": "enter",
			"Ctrl+Enter": "enterNoAutoIndent",
			"Shift+Tab": "shiftTab",
			"Ctrl+X": "cut",
			"Ctrl+C": "copy",
			"Ctrl+V": "paste",
		},
		
		astKeymap: {
			"PageUp": "pageUp",
			"PageDown": "pageDown",
			"s": "up",
			"d": "down",
			"j": "next",
			"k": "previous",
			"i": "insert",
			"h": "collapseDown",
			"l": "collapseUp",
			//"e": "expandDown",
			"a": "selectSelection",
			"Space": "toggleSpaceBelow",
			"Shift+Space": "toggleSpaceAbove",
		},
		
		globalKeymap: {
			"Ctrl+O": "open",
			"Ctrl+S": "save",
			"Ctrl+N": "_new",
			"Ctrl+Z": "undo",
			"Ctrl+Y": "redo",
			"Ctrl+F": "find",
			"Ctrl+Shift+F": "findInOpenFiles",
			"Ctrl+H": "findAndReplace",
			"Ctrl+Shift+H": "findAndReplaceInOpenFiles",
		},
		
		langs: {
			javascript: {
				colors: {
					keyword: "#aa33aa",
					id: "#202020",
					comment: "#7f7f7f",
					symbol: "#bb22bb",
					bracket: "#202020",
					number: "#cc2222",
					string: "#2233bb",
					regex: "#cc7030",
				},
			},
			
			html: {
				colors: {
					tag: "#0032ff",
					attribute: "#871f78",
					string: "#2233bb",
					text: "#000000",
				},
			},
		},
		
		fileAssociations: {
			"html": ["*.svelte"],
			//"plainText": ["*.js"],
		},
		
		cursorBlinkPeriod: 700,
	};
}

/*
top-level object for general, global things like langs, as well as any
initialisation that needs to be done before any other clientside code runs --
e.g. initialising langs.  this initialisation can be async and is done by
the init() method.

the reason for having a global singleton like this, as opposed to just having
everything in separate modules and the code that uses them require() them
individually, is 1) it is dynamic -- not as quick-changing as the UI, but changes
when e.g. a lang is added -- and 2) some of the init is async, so wouldn't be
immediately available from a require()d module -- having a big init() method
means that code that runs subsequently (which includes the entire UI, so basically
the whole app) can get stuff from the global app object without having to
await it.

this will be passed to plugins etc that need to interact with the app via a
consistent interface.

this can be shared between multiple instances of the UI, e.g. with multiple
instances embedded in a web page, so doesn't know anything about the state of the
UI.
*/

class Base extends Evented {
	constructor() {
		super();
		
		this.prefs = defaultPrefs();
		this.langs = langs;
	}
	
	async init() {
		await TreeSitter.init();
		
		let langs = await Promise.all([
			javascript(),
			//svelte(),
			html(),
			plainText(),
		]);
		
		for (let lang of langs) {
			this.langs.add(lang);
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
	
	plainText is a special case and is hard-coded as the fallback if no supporting
	langs are found, so it should just return null.
	*/
	
	guessLang(code, path) {
		for (let [langCode, patterns] of Object.entries(this.prefs.fileAssociations)) {
			for (let pattern of patterns) {
				if (minimatch(platform.fs(path).name, pattern)) {
					return this.langs.get(langCode);
				}
			}
		}
		
		let general = null;
		let alternate = null;
		let fallback = this.langs.get("plainText");
		
		for (let lang of this.langs.all) {
			let supportLevel = lang.getSupportLevel(code, path);
			
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
	
	getFileDetails(code, path) {
		let {
			defaultIndent,
			tabWidth,
			defaultNewline,
		} = this.prefs;
		
		let indent = guessIndent(code) || defaultIndent;
		let lang = this.guessLang(code, path);
		
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
	
	getDefaultFileDetails() {
		let {
			defaultIndent,
			tabWidth,
			defaultNewline,
			defaultLang,
		} = this.prefs;
		
		let lang = this.langs.get(defaultLang);
		let indentation = getIndentationDetails(defaultIndent, tabWidth);
		
		return {
			indentation,
			tabWidth,
			lang,
			newline: defaultNewline,
			hasMixedNewlines: false,
		};
	}
}

module.exports = Base;
