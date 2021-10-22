let ipcRenderer = require("platform/modules/ipcRenderer");

let servers = {};

module.exports = {
	async create(langCode, capabilities, initOptions, dirs) {
		let {
			id,
			serverCapabilities,
		} = await ipcRenderer.invoke("lspServer", "create", langCode, capabilities, initOptions, dirs);
		
		let server = new LspServer(id, langCode, serverCapabilities);
		
		servers[id] = server;
		
		return server;
	},
	
	async request(serverId, method, params) {
		await ipcRenderer.invoke("lspServer", "call", serverId, method, params);
	},
};
