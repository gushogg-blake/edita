let guessIndent = require("./modules/utils/guessIndent");
let checkNewlines = require("./modules/utils/checkNewlines");

let js = require("./modules/langs/js");
let html = require("./modules/langs/html");
let langs = require("./modules/langs");

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

it won't necessarily contain all (or possibly even any) of the visible state like
what tabs are open etc -- that will be mostly up to the Svelte components.
*/

class App {
	constructor() {
		this.langs = langs;
	}
	
	async init() {
		await TreeSitter.init();
		
		let langs = await Promise.all([
			js(),
			html(),
		]);
		
		for (let lang of langs) {
			this.langs.add(lang.code, lang);
		}
	}
	
	guessLang(code, path) {
		return this.langs.get("js"); // DEV
	}
	
	getFileDetails(prefs, code, path) {
		let {
			defaultLang,
			defaultIndent,
			tabWidth,
			defaultNewline,
		} = prefs;
		
		let indent = guessIndent(code) || defaultIndent;
		let lang = this.guessLang(code, path) || this.langs.get(defaultLang);
		let indentType = indent[0] === "\t" ? "tab" : "space";
		
		let {
			mixed: hasMixedNewlines, // NOTE may not need this as no longer using split() to split the code into lines (treesitter)
			mostCommon: newline,
		} = checkNewlines(code);
		
		if (!newline) {
			newline = defaultNewline;
		}
	
		let indentation = {
			string: indent,
			re: new RegExp("^(" + indent + ")*"),
			colsPerIndent: indentType === "tab" ? indent.length * tabWidth : indent.length,
		};
		
		return {
			indentation,
			tabWidth,
			lang,
			newline,
			hasMixedNewlines,
		};
	}
}

module.exports = App;
