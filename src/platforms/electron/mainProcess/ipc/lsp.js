let lid = require("../utils/lid");
let LspServer = require("../modules/LspServer");

module.exports = function(app) {
	let servers = {};
	
	function sendNotification(serverId, notification) {
		app.sendToRenderers("lspNotification", serverId, notification);
	}
	
	function remove(serverId) {
		delete servers[serverId];
		
		app.sendToRenderers("lspServerExit", serverId);
	}
	
	return {
		async createServer(e, langCode, options) {
			let id = lid();
			let server = new LspServer(app, id, langCode);
			
			server.on("notification", (notification) => sendNotification(id, notification));
			server.on("exit", () => remove(id));
			
			let serverCapabilities = await server.init(options);
			
			servers[id] = server;
			
			return {
				id,
				serverCapabilities,
			};
		},
		
		request(e, serverId, method, params) {
			return servers[serverId].request(method, params);
		},
		
		notify(e, serverId, method, params) {
			servers[serverId].notify(method, params);
		},
	};
}
