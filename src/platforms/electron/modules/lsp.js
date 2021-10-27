let ipc = require("platform/modules/ipc");

module.exports = function(lspConfig) {
	return {
		createServer(langCode, initOptions, dirs) {
			let capabilities = lspConfig.capabilities[langCode];
			
			initOptions = {
				...lspConfig.initOptions[langCode],
				...initOptions,
			};
			
			return ipc.lspServer.create(langCode, capabilities, initOptions, dirs);
		},
		
		request(serverId, method, params) {
			return ipc.lspServer.request(serverId, method, params);
		},
		
		notify(serverId, method, params) {
			ipc.lspServer.notify(serverId, method, params);
		},
	};
}