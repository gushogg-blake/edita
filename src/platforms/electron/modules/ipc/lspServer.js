let LspServer = require("modules/LspServer");
let ipcRenderer = require("platform/modules/ipcRenderer");

let servers = {};

ipcRenderer.on("lspNotification", function(e, serverId, notification) {
	servers[serverId]?.notificationReceived(notification);
});

ipcRenderer.on("lspServerExit", function(e, serverId) {
	servers[serverId]?.exit();
	
	delete servers[serverId];
});

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
	
	request(serverId, method, params) {
		return ipcRenderer.invoke("lspServer", "request", serverId, method, params);
	},
	
	notify(serverId, method, params) {
		ipcRenderer.invoke("lspServer", "notify", serverId, method, params);
	},
};
