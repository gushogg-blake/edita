let LspServer = require("modules/LspServer");
let webSocket = require("platform/modules/webSocket");

let servers = {
	javascript: new LspServer("javascript", "javascript", {}),
	html: new LspServer("html", "html", {}),
	css: new LspServer("css", "css", {}),
};

module.exports = function(url) {
	let socket = webSocket(url, {
		notification(message) {
			
		},
	});
	
	return {
		async create(langCode, capabilities, initOptions, workspaceFolders) {
			return servers[langCode];
		},
		
		request(serverId, method, params) {
			return socket.invoke({
				serverId,
				method,
				params,
			});
		},
		
		notify(serverId, method, params) {
			socket.send({
				serverId,
				method,
				params,
			});
		},
	};
}
