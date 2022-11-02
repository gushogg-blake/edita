let Evented = require("utils/Evented");

class LspServer extends Evented {
	constructor(options, backend) {
		super();
		
		this.options = options;
		this.backend = backend;
	}
	
	async start() {
		let {key, serverCapabilities} = await this.backend.start(this.options);
		
		this.serverCapabilities = serverCapabilities;
		
		return key;
	}
	
	request(method, params) {
		return this.backend.request(method, params);
	}
	
	notify(method, params) {
		this.backend.notify(method, params);
	}
	
	close() {
		return this.backend.close();
	}
	
	onNotificationReceived(notification) {
		this.fire("", notification);
	}
	
	/*
	server stopped unexpectedly - handlers can call the passed function to
	restart with current options.
	*/
	
	onStop() {
		this.fire("stop", (options) => {
			this.options = options;
			
			return this.start();
		});
	}
	
	/*
	server intentionally closed, e.g. after closing all files in a project
	*/
	
	onClose() {
		this.fire("close");
	}
}

module.exports = LspServer;
