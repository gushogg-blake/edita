let ipcRenderer = require("platform/modules/ipcRenderer");

let servers = {};

ipcRenderer.on("lspNotification", function(e, serverId, notification) {
	servers[serverId]?.notificationReceived(notification);
}

module.exports = {
	async create(langCode, capabilities, initOptions, workspaceFolders) {
		let {
			id,
			serverCapabilities,
		} = await ipcRenderer.invoke("lspServer", "create", langCode, capabilities, initOptions, workspaceFolders);
		
		let server = new LspServer(id, langCode, serverCapabilities);
		
		servers[id] = server;
		
		return server;
	},
	
	async request(serverId, method, params) {
		await ipcRenderer.invoke("lspServer", "call", serverId, method, params);
	},
};
