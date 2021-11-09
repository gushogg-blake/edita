let Evented = require("utils/Evented");
let ipcRenderer = require("platform/modules/ipcRenderer");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
	}
	
	async init() {
		document.title = this.options.title || "";
	}
	
	respond(buttonIndex) {
		ipcRenderer.invoke("callOpener", "call", "messageBoxResponse", buttonIndex);
	}
	
	teardown() {
		
	}
}

module.exports = App;
