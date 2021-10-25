let lid = require("../utils/lid");
let LspServer = require("../modules/LspServer");

module.exports = function(app) {
	let servers = {};
	
	function sendNotification(serverId, notification) {
		//console.log(notification);
		//app.sendToRenderers("lspNotification", serverId, notification);
	}
	
	function remove(server) {
		delete servers[server.id];
	}
	
	return {
		async create(e, langCode, capabilities, initOptions, workspaceFolders) {
			let id = lid();
			let server = new LspServer(id, langCode);
			
			server.on("notification", (notification) => sendNotification(server, notification));
			server.on("exit", () => remove(server));
			
			let serverCapabilities = await server.init(capabilities, initOptions, workspaceFolders);
			
			console.log(serverCapabilities);
			
			return {
				id,
				serverCapabilities,
			};
		},
		
		call(e, serverId, method, params) {
			let server = servers[serverId];
			
			return server.request(method, params);
		},
	};
}
