let Evented = require("utils/Evented");
let lid = require("utils/lid");
let URL = require("modules/URL");
let normaliseLangCode = require("modules/lsp/utils/normaliseLangCode");
let cursorToLspPosition = require("modules/lsp/utils/cursorToLspPosition");
let maskOtherRegions = require("modules/lsp/utils/maskOtherRegions");
let LspError = require("modules/lsp/LspError");

class LspClient extends Evented {
	constructor() {
		super();
		
		this.servers = {};
		this.unavailableLangCodes = new Set();
		
		this.scopesByDocument = new WeakMap();
		this.scopesByUri = new Map();
		this.urisByScope = new WeakMap();
	}
	
	serverKey(langCode) {
		return langCode + ":" + this.key;
	}
	
	startServer(langCode) {
		let server = platform.lsp.start(this.serverKey(langCode), langCode, {
			workspaceFolders: this.dirs,
		});
		
		let markUnavailable = () => {
			delete this.servers[langCode];
			
			this.unavailableLangCodes.add(langCode);
		}
		
		server.start().then(({error}) => {
			if (error) {
				console.log("Error starting server for " + langCode);
				console.log(error);
				
				markUnavailable();
			}
		}, (e) => {
			console.error(e);
			
			markUnavailable();
		});
		
		server.on("notification", this.onNotification.bind(this, server));
		server.on("error", this.onServerError.bind(this, server));
		
		this.servers[langCode] = server;
	}
	
	getServer(langCode) {
		langCode = normaliseLangCode(langCode);
		
		if (!platform.lsp || this.unavailableLangCodes.has(langCode)) {
			throw new LspError("Language " + langCode + " unavailable");
		}
		
		if (!this.servers[langCode]) {
			this.startServer(langCode);
		}
		
		return this.servers[langCode];
	}
	
	async withServer(lang, fn, _default) {
		try {
			return await fn(this.getServer(lang.code));
		} catch (e) {
			if (e instanceof LspError) {
				console.log(e);
			} else {
				console.error(e);
			}
			
			return _default;
		}
	}
	
	closeServer(langCode) {
		langCode = normaliseLangCode(langCode);
		
		delete this.servers[langCode];
		
		return platform.lsp.close(this.serverKey(langCode));
	}
	
	onNotification(server, notification) {
		this.fire("notification", {
			server,
			notification,
		});
	}
	
	onServerError(server, error) {
		this.fire("serverError", {
			server,
			error,
		});
	}
	
	createUriForScope(document, scope) {
		return URL.file(document.path).toString() + "#" + lid();
	}
	
	async getCompletions(document, cursor) {
		let {scope} = document.rangeFromCursor(cursor);
		let {lang} = scope;
		let uri = this.urisByScope.get(scope);
		
		return await this.withServer(lang, async (server) => {
			let {error, result} = await server.request("textDocument/completion", {
				textDocument: {
					uri,
				},
				
				position: cursorToLspPosition(cursor),
			});
			
			if (error) {
				console.log("Error fetching completions for lang " + lang.code);
				console.log(error);
				
				return [];
			}
			
			let {items, isIncomplete} = result;
			
			let completions = items.slice(0, 20).map(function(completion) {
				return completion;
			});
			
			return completions;
		}, []);
	}
	
	async getDefinition(document, cursor) {
		let {scope} = document.rangeFromCursor(cursor);
		let {lang} = scope;
		let uri = this.urisByScope.get(scope);
		
		return await this.withServer(lang, async (server) => {
			let {error, result} = await server.request("textDocument/definition", {
				textDocument: {
					uri,
				},
				
				position: cursorToLspPosition(cursor),
			});
			
			if (error) {
				console.log("Error fetching definition for lang " + lang.code);
				console.log(error);
				
				return [];
			}
			
			console.log(result);
			
			return result;
		}, []);
	}
	
	registerDocument(document) {
		let {scopes} = document;
		
		this.scopesByDocument.set(document, new Set(scopes));
		
		for (let scope of scopes) {
			this.registerScope(document, scope);
		}
		
		document.on("edit formatChanged", this.updateScopes.bind(this, document));
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
		
		this.withServer(lang, (server) => {
			let code = maskOtherRegions(scope);
			
			return server.notify("textDocument/didOpen", {
				textDocument: {
					uri,
					languageId: lang.code,
					version: 1,
					text: code,
				},
			});
		});
	}
	
	unregisterScope(scope) {
		let uri = this.urisByScope.get(scope);
		let {lang} = scope;
		
		this.withServer(lang, (server) => {
			return server.notify("textDocument/didClose", {
				textDocument: {
					uri,
				},
			});
		});
		
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
