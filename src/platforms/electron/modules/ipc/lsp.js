let Evented = require("utils/Evented");
let ipcRenderer = require("platform/modules/ipcRenderer");

let servers = {};

ipcRenderer.on("lspNotification", function(e, serverId, notification) {
	servers[serverId]?.fire("notificationReceived", notification);
});

ipcRenderer.on("lspServerExit", function(e, serverId) {
	servers[serverId]?.fire("exit");
	
	delete servers[serverId];
});

class Server extends Evented {
	constructor(id, serverCapabilities) {
		super();
		
		this.id = id;
		this.serverCapabilities = serverCapabilities;
	}
	
	request(method, params) {
		return ipcRenderer.invoke("lsp", "request", this.id, method, params);
	}
	
	notify(method, params) {
		ipcRenderer.invoke("lsp", "notify", this.id, method, params);
	}
}

module.exports = {
	async createServer(langCode, options) {
		let {
			id,
			serverCapabilities,
		} = await ipcRenderer.invoke("lsp", "createServer", langCode, options);
		
		let server = new Server(id, serverCapabilities);
		
		servers[id] = server;
		
		return server;
	},
};
