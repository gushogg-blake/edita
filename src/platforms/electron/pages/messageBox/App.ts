let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
		
		this.hasResponded = false;
		
		this.teardownCallbacks = [
			platform.on("dialogClosed", this.onDialogClosed.bind(this)),
		];
	}
	
	async init() {
		document.title = this.options.title || "";
	}
	
	_respond(buttonIndex) {
		if (this.hasResponded) {
			return;
		}
		
		platform.callOpener("dialogResponse", {
			name: "messageBox",
			response: buttonIndex,
		});
		
		this.hasResponded = true;
	}
	
	respond(response) {
		this._respond(response);
		
		window.close();
	}
	
	onDialogClosed() {
		this._respond(null);
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

export default App;
