let Evented = require("utils/Evented");

class LspServer extends Evented {
	constructor(id, langCode) {
		this.id = id;
		this.langCode = langCode;
	}
	
	request(method, params) {
		return platform.lspRequest(this.id, method, params);
	}
	
	notificationReceived(notification) {
		this.fire("notification", notification);
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = LspServer;
