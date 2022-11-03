let Evented = require("utils/Evented");

class LspServer extends Evented {
	constructor(options, backend) {
		super();
		
		this.options = options;
		this.backend = backend;
	}
	
	async start() {
		let serverCapabilities = await this.backend.start(this.options);
		
		this.serverCapabilities = serverCapabilities;
	}
	
	request(method, params) {
		return this.backend.request(method, params);
	}
	
	notify(method, params) {
		this.backend.notify(method, params);
	}
	
	onNotificationReceived(notification) {
		this.fire("notificationReceived", notification);
	}
}

module.exports = LspServer;
