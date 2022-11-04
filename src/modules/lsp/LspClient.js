let Evented = require("utils/Evented");
let lid = require("utils/lid");
let URL = require("modules/URL");
let cursorToLspPosition = require("modules/lsp/utils/cursorToLspPosition");
let maskOtherRegions = require("modules/lsp/utils/maskOtherRegions");

class LspClient extends Evented {
	constructor(project) {
		super();
		
		this.project = project;
		this.scopesByDocument = new WeakMap();
		this.scopesByUri = new Map();
		this.urisByScope = new WeakMap();
	}
	
	createUriForScope(document, scope) {
		console.log(document, scope);
		return URL.file(document.path).toString() + "#" + lid();
	}
	
	async getCompletions(document, cursor) {
		let {scope} = document.rangeFromCursor(cursor);
		let {lang} = scope;
		let uri = this.urisByScope.get(scope);
		
		try {
			let server = this.project.getLspServer(lang.code);
			
			let result = await server.request("textDocument/completion", {
				textDocument: {
					uri,
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
	
	registerDocument(document) {
		let {scopes} = document;
		
		this.scopesByDocument.set(document, new Set(scopes));
		
		for (let scope of scopes) {
			this.registerScope(document, scope);
		}
		
		document.on("edit fileDetailsChanged", this.updateScopes.bind(this, document));
	}
	
	unregisterDocument(document) {
		for (let scope of document.scopes) {
			this.unregisterScope(scope);
		}
		
		this.scopesByDocument.delete(document);
	}
	
	registerScope(document, scope) {
		let uri = this.createUriForScope(document, scope);
		let {lang} = scope;
		
		this.scopesByUri.set(uri, scope);
		this.urisByScope.set(scope, uri);
		
		let server = this.project.getLspServer(lang.code);
		let code = maskOtherRegions(scope);
		
		server.notify("textDocument/didOpen", {
			textDocument: {
				uri,
				languageId: lang.code,
				version: 1,
				text: code,
			},
		}).catch(e => console.error(e));
	}
	
	unregisterScope(scope) {
		let uri = this.urisByScope.get(scope);
		let {lang} = scope;
		
		let server = this.project.getLspServer(lang.code);
		
		server.notify("textDocument/didClose", {
			textDocument: {
				uri,
			},
		}).catch(e => console.error(e));
		
		this.scopesByUri.delete(uri);
		this.urisByScope.delete(scope);
	}
	
	updateScopes(document) {
		let oldScopes = this.scopesByDocument.get(document);
		let newScopes = new Set(document.scopes);
		
		for (let scope of oldScopes) {
			if (!newScopes.has(scope)) {
				this.unregisterScope(scope);
			}
		}
		
		for (let scope of newScopes) {
			if (!oldScopes.has(scope)) {
				this.registerScope(document, scope);
			}
		}
		
		this.scopesByDocument.set(document, newScopes);
	}
}

module.exports = LspClient;
