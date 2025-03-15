let Evented = require("utils/Evented");

class LspServer extends Evented {
	constructor(options, backend) {
		super();
		
		this.options = options;
		this.backend = backend;
	}
	
	async start() {
		let {error, result} = await this.backend.start(this.options);
		
		this.serverCapabilities = result;
		
		return {error, result};
	}
	
	request(method, params) {
		return this.backend.request(method, params);
	}
	
	notify(method, params) {
		return this.backend.notify(method, params);
	}
	
	onNotification(notification) {
		this.fire("notification", notification);
	}
	
	onError(error) {
		this.fire("error", error);
	}
}

export default LspServer;
