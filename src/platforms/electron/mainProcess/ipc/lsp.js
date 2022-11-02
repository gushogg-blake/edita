let lid = require("../utils/lid");
let LspServer = require("../modules/LspServer");

module.exports = function(app) {
	let servers = {};
	
	function sendNotification(key, notification) {
		app.sendToRenderers("lspNotification", key, notification);
	}
	
	function remove(key, server) {
		if (servers[key] === server) {
			delete servers[key];
		}
		
		app.sendToRenderers("lspServerExit", key);
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
			server.on("exit", () => remove(key, server));
			
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
