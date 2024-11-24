let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
		
		document.title = ({
			openFile: "Select files",
			openDir: "Select a folder",
			save: "Save as",
		})[options.type];
		
		this.selectedEntry = null;
		
		this.teardownCallbacks = [
			platform.on("dialogClosed", this.onDialogClosed.bind(this)),
		];
	}
	
	select(entry) {
		this.selectedEntry = entry;
		
		this.fire("select", entry);
	}
	
	
	
	async init() {
		let {type, path} = this.options;
		
		console.log(type, path);
	}
	
	respond(response) {
		platform.callOpener("dialogResponse", {
			name: "fileChooser",
			response,
		});
	}
	
	onDialogClosed() {
		this.respond({
			canceled: true,
		});
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = App;
