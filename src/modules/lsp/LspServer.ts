import Evented from "utils/Evented";

class LspServer extends Evented<{
	notification: any;
	error: any;
}> {
	serverCapabilities: any;
	
	// TYPE available here: https://github.com/microsoft/vscode-languageserver-node/blob/df05883f34b39255d40d68cef55caf2e93cff35f/protocol/src/common/protocol.ts#L1503
	// not sure how to handle this -- would be better if LSP provided types directly
	// or there was a @types module... would be good to know which version the
	// types were based on
	private initializeParams: any; 
	private backend: any; // TYPE may not be necessary as we should probs make LSP electron only so it can be hard-coded
	
	constructor(initializeParams, backend) {
		super();
		
		this.initializeParams = initializeParams;
		this.backend = backend;
	}
	
	async start() {
		let {error, result} = await this.backend.start(this.initializeParams);
		
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
