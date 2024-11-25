let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
		
		this.path = options.path;
		
		document.title = ({
			openFile: "Select files",
			openDir: "Select a folder",
			save: "Save as",
		})[options.type];
		
		this.selectedEntry = null;
		
		this.getBookmarks();
		
		this.teardownCallbacks = [
			platform.on("dialogClosed", this.onDialogClosed.bind(this)),
		];
	}
	
	async getBookmarks() {
		try {
			let str = await platform.fs(platform.systemInfo.homeDir, ".config", "gtk-3.0", "bookmarks").read();
			let lines = str.split("\n").map(s => s.trim()).filter(Boolean);
			let normalDirs = lines.filter(line => line.startsWith("file://")).map(line => line.substr("file://".length));
			
			return normalDirs;
		} catch (e) {
			console.log(e);
			
			return [];
		}
	}
	
	nav(path) {
		this.path = path;
		
		this.fire("nav", path);
	}
	
	select(entry) {
		this.selectedEntry = entry;
		
		this.fire("select", entry);
	}
	
	dblclick(entry) {
		let {path} = entry.node;
	
		if (entry.isDir) {
			this.nav(path);
		} else {
			if (this.mode === "openDir") {
				
			} else {
				console.log("choose " + path);
			}
		}
	}
	
	async init() {
		
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
