let Evented = require("utils/Evented");

class LspServer extends Evented {
	constructor(options, backend) {
		super();
		
		this.options = options;
		this.backend = backend;
	}
	
	async start() {
		this.serverCapabilities = await this.backend.start(this.options);
	}
	
	request(method, params) {
		return this.backend.request(method, params);
	}
	
	notify(method, params) {
		return this.backend.notify(method, params);
	}
	
	onNotificationReceived(notification) {
		this.fire("notification", notification);
	}
	
	onError(error) {
		this.fire("error", error);
	}
}

module.exports = LspServer;
