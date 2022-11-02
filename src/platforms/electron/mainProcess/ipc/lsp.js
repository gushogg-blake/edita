let lid = require("../utils/lid");
let LspServer = require("../modules/LspServer");

module.exports = function(app) {
	let servers = {};
	
	function sendNotification(key, notification) {
		app.sendToRenderers("lspNotification", key, notification);
	}
	
	function stop(key, server) {
		remove(key, server);
		
		app.sendToRenderers("lspServerStop", key);
	}
	
	function onClose(key, server) {
		remove(key, server);
		
		app.sendToRenderers("lspServerClose", key);
	}
	
	function onError(key, error) {
		app.sendToRenderers("lspServerError", key, error);
	}
	
	function remove(key, server) {
		if (servers[key] === server) {
			delete servers[key];
		}
	}
	
	return {
		async createServer(e, projectKey, langCode, options) {
			let key = langCode + ":" + projectKey;
			
			if (servers[key]) {
				servers[key].close();
			}
			
			let server = new LspServer(app, langCode);
			
			servers[key] = server;
			
			server.on("notification", (notification) => sendNotification(key, notification));
			server.on("stop", () => onStop(key, server));
			server.on("close", () => onClose(key, server));
			server.on("error", (error) => onError(key, error));
			
			let serverCapabilities = await server.init(options);
			
			return {
				key,
				serverCapabilities,
			};
		},
		
		request(e, key, method, params) {
			return servers[key].request(method, params);
		},
		
		notify(e, key, method, params) {
			servers[key].notify(method, params);
		},
	};
}
