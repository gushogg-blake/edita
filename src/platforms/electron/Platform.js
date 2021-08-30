let {ipcRenderer} = require("electron");
let os = require("os");
let path = require("path");
let fsExtra = require("fs-extra");
let minimatch = require("minimatch");
let glob = require("glob");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");
let Evented = require("utils/Evented");
let fs = require("../common/modules/fs");
let init = require("./modules/ipc/init");
let dialog = require("./modules/ipc/dialog");
let clipboard = require("./modules/ipc/clipboard");
let contextMenu = require("./modules/ipc/contextMenu");
let prefs = require("./modules/ipc/prefs");
let snippets = require("./modules/ipc/snippets");
let session = require("./modules/ipc/session");

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
		
		zoom: {
			stopAtProjectRoot: true,
		},
		
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
			"Ctrl+A": "selectAll",
			"Ctrl+Space": "completeWord",
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
			
			css: {
				colors: {
					tagName: "#0032ff",
					className: "#008b8b",
					idName: "#8b0000",
					property: "#333333",
					attribute: "#871f78",
					string: "#2233bb",
					comment: "#7f7f7f",
					symbol: "#333333",
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

class Platform extends Evented {
	constructor() {
		super();
		
		let {
			config,
			systemInfo,
			isMainWindow,
		} = init;
		
		this.config = config;
		this.systemInfo = systemInfo;
		this.isMainWindow = isMainWindow;
		
		this.clipboard = clipboard;
		this.path = path;
		
		this.fs = fs({
			fs: fsExtra,
			path,
			minimatch,
			glob,
			
			cwd() {
				return process.cwd();
			},
		});
		
		prefs.on("update", this.onPrefsUpdate.bind(this));
		snippets.on("new", this.onNewSnippet.bind(this));
		snippets.on("update", this.onSnippetUpdate.bind(this));
		
		ipcRenderer.on("closeWindow", () => {
			let defaultPrevented = false;
			
			this.fire("closeWindow", {
				preventDefault() {
					defaultPrevented = true;
				},
			});
			
			if (!defaultPrevented) {
				this.fire("windowClosing");
				
				ipcRenderer.send("closeWindow");
			}
		});
	}
	
	async init() {
		this.prefs = await prefs.load() || defaultPrefs();
		this.snippets = await snippets.load();
	}
	
	async open(dir=null) {
		let defaultPath = dir || os.homedir();
		
		let {
			canceled,
			filePaths,
		} = await dialog.showOpen({
			defaultPath,
			
			properties: [
				"openFile",
				"multiSelections",
			],
		});
		
		if (canceled) {
			return [];
		}
		
		return filePaths;
	}
	
	async save(path, code) {
		await this.fs(path).write(code);
	}
	
	async saveAs() {
		let {filePath} = await dialog.showSave({
			
		});
		
		return filePath || null;
	}
	
	showMessageBox(options) {
		return dialog.showMessageBox({
			normalizeAccessKeys: true,
			...options,
		});
	}
	
	showContextMenu(e, items) {
		contextMenu(items);
	}
	
	openWindow(url, options, callback) {
		let {
			title = "Editor",
			width = 800,
			height = 600,
			top = null,
			left = null,
		} = options;
		
		if (top === null) {
			top = Math.round(window.screenTop + (window.outerHeight - height) / 2);
		}
		
		if (left === null) {
			left = Math.round(window.screenLeft + (window.outerWidth - width) / 2);
		}
		
		let win = window.open(url, "", "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left);
		
		win.addEventListener("load", function() {
			win.document.title = title;
			
			callback({
				el: win.document.body,
				
				closeWindow() {
					win.close();
				},
			});
		});
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(path.join(__dirname, "public", "vendor", "tree-sitter", "langs", name + ".wasm"));
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
		
		prefs.save(this.prefs);
	}
	
	onPrefsUpdate() {
		this.fire("prefsUpdated");
	}
	
	onNewSnippet() {
		
	}
	
	onSnippetUpdate() {
		
	}
	
	editSnippet(snippet) {
		
	}
	
	getSnippet(name) {
		return this.snippets.find(s => s.name === name);
	}
	
	loadSession() {
		return session.load();
	}
	
	saveSession(data) {
		return session.save(data);
	}
}

module.exports = Platform;
