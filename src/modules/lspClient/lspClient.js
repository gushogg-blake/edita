let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let URL = require("modules/URL");

let maskOtherRegions = require("./utils/maskOtherRegions");

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
		try {
			let scope = document.scopeFromCursor(cursor);
			
			if (!scope) {
				return [];
			}
			
			let {project} = document;
			let langCode = scope.lang.code;
			let code = maskOtherRegions(document, scope);
			let uri = URL.tmpVirtual();
			
			await (project || base).lspRequest(langCode, "textDocument/didOpen", {
				textDocument: {
					uri,
					languageId: langCode,
					version: 1,
					text: code,
				},
			});
			
			return await bluebird.map(project.lspRequest(langCode, "textDocument/completion", {
				
			}), function(completion) {
				return completion;
			});
		} catch (e) {
			return [];
		}
	}
}

module.exports = new LspClient();