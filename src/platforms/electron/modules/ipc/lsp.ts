import LspServer from "modules/lsp/LspServer";
import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import baseInitializeParams from "modules/lsp/baseInitializeParams";

let servers = {};

ipcRenderer.on("lspNotification", function(e, key, notification) {
	servers[key]?.onNotification(notification);
});

ipcRenderer.on("lspServerError", function(e, key, error) {
	servers[key]?.onError(error);
});

export default {
	start(key, langCode, initializeParams) {
		initializeParams = {
			...baseInitializeParams.common,
			...baseInitializeParams.perLang[langCode],
			...initializeParams,
			
			initializationOptions: {
				...baseInitializeParams.perLang[langCode]?.initializationOptions,
				...initializeParams.initializationOptions,
			},
		};
		
		let server = new LspServer(initializeParams, {
			start(initializeParams) {
				return ipcRenderer.invoke("lsp", "start", key, langCode, initializeParams);
			},
			
			request(method, params) {
				return ipcRenderer.invoke("lsp", "request", key, langCode, method, params);
			},
			
			notify(method, params) {
				return ipcRenderer.invoke("lsp", "notify", key, langCode, method, params);
			},
		});
		
		servers[key] = server;
		
		return server;
	},
	
	close(key) {
		return ipcRenderer.invoke("lsp", "close", key);
	},
};
