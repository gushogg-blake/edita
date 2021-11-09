let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
		
		this.teardownCallbacks = [
			platform.on("dialogClosed", this.onDialogClosed.bind(this)),
		];
	}
	
	async init() {
		document.title = this.options.title || "";
	}
	
	respond(buttonIndex) {
		platform.callOpener("messageBoxResponse", buttonIndex);
	}
	
	onDialogClosed() {
		this.respond(null);
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = App;
