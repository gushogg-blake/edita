let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let sleep = require("utils/sleep");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let URL = require("modules/URL");

let maskOtherRegions = require("./utils/maskOtherRegions");
let cursorToLspPosition = require("./utils/cursorToLspPosition");

let {s} = Selection;
let {c} = Cursor;

class LspClient extends Evented {
	constructor() {
		super();
	}
	
	init() {
		platform.on("lspNotification", this.onNotification.bind(this));
	}
	
	async getCompletions(document, cursor) {
		let scope = document.scopeFromCursor(cursor);
		
		console.log(scope);
		
		if (!scope) {
			return [];
		}
		
		let {project} = document;
		let langCode = scope.lang.code;
		let code = maskOtherRegions(document, scope);
		let uri = URL.virtual(document.path).toString();
		let lsp = project || base;
		
		await lsp.lspNotify(langCode, "textDocument/didOpen", {
			textDocument: {
				uri,
				languageId: langCode,
				version: 1,
				text: code,
			},
		});
		
		await sleep(100);
		
		console.log(cursorToLspPosition(cursor));
		
		let result = await lsp.lspRequest(langCode, "textDocument/completion", {
			textDocument: {
				uri,
			},
			
			position: cursorToLspPosition(cursor),
		});
		
		let {items, isIncomplete} = result;
		
		let completions = items.map(function(completion) {
			return completion;
		});
		
		await lsp.lspNotify(langCode, "textDocument/didClose", {
			textDocument: {
				uri,
			},
		});
		
		console.log("??");
		
		return completions;
	}
}

module.exports = new LspClient();
