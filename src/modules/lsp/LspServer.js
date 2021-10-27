let Evented = require("utils/Evented");

class LspServer extends Evented {
	constructor(id, langCode, serverCapabilities) {
		super();
		
		this.id = id;
		this.langCode = langCode;
		this.serverCapabilities = serverCapabilities;
	}
	
	request(method, params) {
		return platform.lsp.request(this.id, method, params);
	}
	
	notify(method, params) {
		platform.lsp.notify(this.id, method, params);
	}
	
	notificationReceived(notification) {
		this.fire("notification", notification);
	}
	
	exit() {
		this.fire("exit");
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = LspServer;
