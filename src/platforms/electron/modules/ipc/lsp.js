let LspServer = require("platforms/common/modules/LspServer");
let ipcRenderer = require("platform/modules/ipcRenderer");

let servers = {};

ipcRenderer.on("lspNotification", function(e, serverId, notification) {
	servers[serverId]?.fire("notificationReceived", notification);
});

ipcRenderer.on("lspServerExit", function(e, serverId) {
	servers[serverId]?.fire("exit");
	
	delete servers[serverId];
});

module.exports = {
	async createServer(langCode, options) {
		let {
			id,
			serverCapabilities,
		} = await ipcRenderer.invoke("lsp", "createServer", langCode, options);
		
		let server = new LspServer({
			request(method, params) {
				return ipcRenderer.invoke("lsp", "request", id, method, params);
			},
			
			notify(method, params) {
				ipcRenderer.invoke("lsp", "notify", id, method, params);
			},
		}, serverCapabilities);
		
		servers[id] = server;
		
		return server;
	},
};
