let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
		
		this.mode = options.mode;
		this.path = options.path;
		
		this.name = "";
		this.entries = [];
		this.selectedEntries = [];
		
		this.hasResponded = false;
		
		document.title = ({
			selectFiles: "Select files",
			selectDir: "Select a folder",
			save: "Save as",
		})[options.mode];
		
		this.getBookmarks();
		
		this.teardownCallbacks = [
			platform.on("dialogClosed", this.onDialogClosed.bind(this)),
		];
	}
	
	async getBookmarks() {
		try {
			// PLATFORM - assumes GTK
			let str = await platform.fs(platform.systemInfo.homeDir, ".config", "gtk-3.0", "bookmarks").read();
			let lines = str.split("\n").map(s => s.trim()).filter(Boolean);
			let normalDirs = lines.filter(line => line.startsWith("file://")).map(line => line.substr("file://".length));
			
			return normalDirs;
		} catch (e) {
			console.log(e);
			
			return [];
		}
	}
	
	async init() {
		this.load();
	}
	
	async load() {
		this.entries = await base.DirEntries.ls(this.path);
		this.selectedEntries = this.entries.length > 0 ? [this.entries[0]] : [];
		
		this.fire("updateEntries");
		this.fire("updateSelected");
	}
	
	setName(name) {
		this.name = name;
	}
	
	async nav(path) {
		this.path = path;
		
		await this.load();
	}
	
	select(entry) {
		this.selectedEntries = [entry];
		
		this.fire("updateSelected");
	}
	
	//cancel() {
	//	window.close();
	//}
	
	ok() {
		if (this.mode === "selectDir") {
			this.respond({
				path: this.path,
			});
		} else if (this.mode === "selectFiles") {
			this.respond({
				paths: this.selectedEntries.map(entry => entry.path),
			});
		} else if (this.mode === "save") {
			if (!this.name.trim()) {
				throw new Error("name required");
			}
			
			this.respond({
				path: platform.fs(this.path).child(this.name).path,
			});
		}
	}
	
	dblclick(entry) {
		let {path} = entry.node;
		
		if (entry.isDir) {
			this.nav(path);
		} else {
			if (this.mode === "select") {
				// TODO this should be disabled
			} else if (this.mode === "selectFiles") {
				this.respond({
					paths: [path],
				});
			} else if (this.mode === "save") {
				this.respond({
					path,
				});
			}
		}
	}
	
	async init() {
		this.load();
	}
	
	_respond(response) {
		if (this.hasResponded) {
			return;
		}
		
		platform.callOpener("dialogResponse", {
			name: "fileChooser",
			response,
		});
		
		this.hasResponded = true;
	}
	
	respond(response) {
		this._respond(response);
		
		window.close();
	}
	
	onDialogClosed() {
		this._respond({
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
