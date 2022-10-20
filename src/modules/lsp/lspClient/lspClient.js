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
	
	async getCompletions(document, cursor) {
		let {scope} = document.rangeFromCursor(cursor);
		let {project} = document;
		let langCode = scope.lang.code;
		let code = maskOtherRegions(document, scope);
		//let uri = URL.virtual(document.path).toString();
		let {lspContext} = project || base;
		
		let uri = URL.file(document.path).toString();
		
		try {
			await lspContext.notify(langCode, "textDocument/didOpen", {
				textDocument: {
					uri,
					languageId: langCode,
					version: 1,
					text: code,
				},
			});
			
			//await sleep(1000);
			
			let result = await lspContext.request(langCode, "textDocument/completion", {
				textDocument: {
					uri,
				},
				
				position: cursorToLspPosition(cursor),
			});
			
			let {items, isIncomplete} = result;
			
			let completions = items.slice(0, 20).map(function(completion) {
				return completion;
			});
			
			await lspContext.notify(langCode, "textDocument/didClose", {
				textDocument: {
					uri,
				},
			});
			
			return completions;
		} catch (e) {
			console.error(e);
			
			return [];
		}
	}
}

module.exports = new LspClient();
