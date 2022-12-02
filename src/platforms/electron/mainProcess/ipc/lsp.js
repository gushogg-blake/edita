let lid = require("../utils/lid");
let {removeInPlace} = require("../utils/arrayMethods");
let LspServer = require("../modules/lsp/LspServer");
let config = require("../modules/lsp/config");

module.exports = function(app) {
	function langIsSupported(langCode) {
		return !!config.perLang[langCode];
	}
	
	function success(result) {
		return {result};
	}
	
	function langNotSupported(langCode) {
		return {error: "Language " + langCode + " not supported"};
	}
	
	let servers = {};
	
	function sendNotification(key, notification) {
		app.sendToRenderers("lspNotification", key, notification);
	}
	
	function onError(key, error) {
		app.sendToRenderers("lspServerError", key, error);
	}
	
	/*
	calls to LSP servers are kept in a buffer here so we can queue up calls
	for servers that aren't ready as well as ones that haven't even been
	created yet
	*/
	
	let buffers = {};
	
	function bufferedCall(key, langCode, fn) {
		if (!langIsSupported(langCode)) {
			return langNotSupported(langCode);
		}
		
		return new Promise(function(resolve, reject) {
			if (!buffers[key]) {
				buffers[key] = [];
			}
			
			let started = false;
			
			let run = async function(server) {
				started = true;
				
				try {
					resolve(success(await fn(server)));
				} catch (e) {
					reject(e);
				}
			}
			
			buffers[key].push(run);
			
			setTimeout(function() {
				if (!started) {
					removeInPlace(buffers[key], run);
					
					reject(new Error("Request timed out - no active server"));
				}
			}, config.requestTimeout);
			
			checkBuffer(key);
		});
	}
	
	function checkBuffer(key) {
		if (servers[key]?.ready) {
			let fn;
			
			while (fn = buffers[key].shift()) {
				fn(servers[key]);
			}
		}
	}
	
	return {
		async start(e, key, langCode, initializeParams) {
			if (!langIsSupported(langCode)) {
				return {
					error: "Language " + langCode + " not supported",
				};
			}
			
			if (servers[key]) {
				return servers[key].serverCapabilities;
			}
			
			let server = new LspServer(app, langCode, initializeParams);
			
			servers[key] = server;
			
			server.on("notification", (notification) => sendNotification(key, notification));
			server.on("error", (error) => onError(key, error));
			server.on("start", () => checkBuffer(key));
			
			await server.start();
			
			return success(server.serverCapabilities);
		},
		
		request(e, key, langCode, method, params) {
			return bufferedCall(key, langCode, server => server.request(method, params));
		},
		
		notify(e, key, langCode, method, params) {
			return bufferedCall(key, langCode, server => server.notify(method, params));
		},
		
		close(e, key) {
			servers[key]?.close();
			
			delete servers[key];
			delete buffers[key];
		},
	};
}
