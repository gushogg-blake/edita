let Evented = require("utils/Evented");
let cursorToLspPosition = require("modules/utils/lsp/cursorToLspPosition");

class LspClient extends Evented {
	constructor(project) {
		super();
		
		this.project = project;
	}
	
	async getCompletions(document, cursor) {
		let {lang} = document.rangeFromCursor(cursor).scope;
		
		try {
			let server = await this.project.getServer(lang);
			
			let result = await server.request("textDocument/completion", {
				textDocument: {
					uri: document.lspUri,
				},
				
				position: cursorToLspPosition(cursor),
			});
			
			let {items, isIncomplete} = result;
			
			let completions = items.slice(0, 20).map(function(completion) {
				return completion;
			});
			
			return completions;
		} catch (e) {
			console.error(e);
			
			return [];
		}
	}
}

module.exports = LspClient;