let Evented = require("utils/Evented");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

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
		let scope = document.scopeFromCursor(cursor);
		
		if (!scope) {
			return [];
		}
		
		let {lang} = scope;
		
		let code = maskOtherRegions(document, scope);
		
		console.log(code);
		
		return platform.lspRequest(lang.code, "textDocument/completion", {
			
		});
	}
}

module.exports = new LspClient();
