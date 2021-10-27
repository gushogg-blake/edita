let lid = require("../utils/lid");
let LspServer = require("../modules/lsp/LspServer");

let servers = {};

function remove(server) {
	delete servers[server.id];
}

async function create(langCode, capabilities, initOptions, workspaceFolders) {
	let id = lid();
	let server = new LspServer(id, langCode);
	
	server.on("notification", (notification) => sendNotification(server, notification));
	server.on("exit", () => remove(server));
	
	let serverCapabilities = await server.init(capabilities, initOptions, workspaceFolders);
	
	return {
		id,
		serverCapabilities,
	};
}

function call(e, serverId, method, params) {
	let server = servers[serverId];
	
	return server.request(method, params);
}

(async function() {
	let server = await create("javascript", {}, {preferences: {}}, []);
	
	console.log(server);
})();
