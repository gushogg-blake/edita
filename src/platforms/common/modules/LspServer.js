let Evented = require("utils/Evented");

class LspServer extends Evented {
	constructor(backend, serverCapabilities) {
		super();
		
		this._backend = backend;
		this.serverCapabilities = serverCapabilities;
	}
	
	request(method, params) {
		return this._backend.request(method, params);
	}
	
	notify(method, params) {
		this._backend.notify(method, params);
	}
}

module.exports = LspServer;
