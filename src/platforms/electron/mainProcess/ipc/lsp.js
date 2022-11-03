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
	
	function onClose(key, server) {
		remove(key, server);
	}
	
	function remove(key, server) {
		if (servers[key] === server) {
			delete servers[key];
		}
	}
	
	return {
		async start(e, key, langCode, options) {
			if (servers[key]) {
				servers[key].close();
			}
			
			let server = new LspServer(app, langCode, options);
			
			servers[key] = server;
			
			server.on("notification", (notification) => sendNotification(key, notification));
			server.on("close", () => onClose(key, server));
			server.on("error", (error) => onError(key, error));
			
			return await server.start();
		},
		
		request(e, key, method, params) {
			return servers[key].request(method, params);
		},
		
		notify(e, key, method, params) {
			servers[key].notify(method, params);
		},
		
		close(e, key) {
			servers[key].close();
		},
	};
}
