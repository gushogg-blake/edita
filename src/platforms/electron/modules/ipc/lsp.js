let LspServer = require("platforms/common/modules/LspServer");
let ipcRenderer = require("platform/modules/ipcRenderer");

let servers = {};

ipcRenderer.on("lspNotification", function(e, key, notification) {
	servers[key]?.onNotificationReceived(notification);
});

module.exports = {
	start(key, langCode, options) {
		let server = new LspServer(options, {
			start(options) {
				return ipcRenderer.invoke("lsp", "start", key, langCode, options);
			},
			
			request(method, params) {
				return ipcRenderer.invoke("lsp", "request", key, method, params);
			},
			
			notify(method, params) {
				return ipcRenderer.invoke("lsp", "notify", key, method, params);
			},
		});
		
		servers[key] = server;
		
		return server;
	},
	
	close(key) {
		return ipcRenderer.invoke("lsp", "close", key);
	},
};
