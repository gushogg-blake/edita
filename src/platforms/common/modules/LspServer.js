let Evented = require("utils/Evented");

class LspServer extends Evented {
	constructor(backend) {
		super();
		
		this._backend = backend;
		this.serverCapabilities = serverCapabilities;
	}
	
	start() {
	}
	
	request(method, params) {
		return this._backend.request(method, params);
	}
	
	notify(method, params) {
		this._backend.notify(method, params);
	}
	
	close() {
		return this._backen
	}
}

module.exports = LspServer;
