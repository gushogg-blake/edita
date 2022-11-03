let lid = require("../utils/lid");
let LspServer = require("../modules/LspServer");

module.exports = function(app) {
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
	
	function bufferedCall(key, fn) {
		return new Promise(function(resolve, reject) {
			if (!buffers[key]) {
				buffers[key] = [];
			}
			
			buffers[key].push(async function(server) {
				try {
					resolve(await fn(server));
				} catch (e) {
					reject(e);
				}
			});
			
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
		async start(e, key, langCode, options) {
			if (servers[key]) {
				return servers[key].serverCapabilities;
			}
			
			let server = new LspServer(app, langCode, options);
			
			servers[key] = server;
			
			server.on("notification", (notification) => sendNotification(key, notification));
			server.on("error", (error) => onError(key, error));
			server.on("start", () => checkBuffer(key));
			
			await server.start();
			
			return server.serverCapabilities;
		},
		
		request(e, key, method, params) {
			return bufferedCall(key, server => server.request(method, params));
		},
		
		notify(e, key, method, params) {
			return bufferedCall(key, server => server.notify(method, params));
		},
		
		close(e, key) {
			servers[key]?.close();
			
			delete servers[key];
			delete buffers[key];
		},
	};
}
