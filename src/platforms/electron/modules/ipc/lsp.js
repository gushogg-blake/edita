let LspServer = require("platforms/common/modules/LspServer");
let ipcRenderer = require("platform/modules/ipcRenderer");

let servers = {};

ipcRenderer.on("lspNotification", function(e, key, notification) {
	servers[key]?.onNotificationReceived(notification);
});

ipcRenderer.on("lspServerStop", function(e, key) {
	servers[key]?.onStop();
});

ipcRenderer.on("lspServerClose", function(e, key) {
	servers[key]?.onClose();
	
	delete servers[key];
});

module.exports = {
	async createServer(projectKey, langCode, options) {
		let server = new LspServer(options, {
			start(options) {
				return ipcRenderer.invoke("lsp", "createServer", projectKey, langCode, options);
			},
			
			request(method, params) {
				return ipcRenderer.invoke("lsp", "request", key, method, params);
			},
			
			notify(method, params) {
				ipcRenderer.invoke("lsp", "notify", key, method, params);
			},
			
			close() {
				return ipcRenderer.invoke("lsp", "close", key);
			},
		});
		
		let key = await server.start();
		
		servers[key] = server;
		
		return server;
	},
};
