let ipcRenderer = require("platform/modules/ipcRenderer");
let Evented = require("utils/Evented");
let handleMessages = require("./utils/handleMessages");

class JsonStore extends Evented {
	constructor(key) {
		super();
		
		this.key = key;
		
		handleMessages("jsonStore", {
			update: (e, key, data) => {
				if (key !== this.key) {
					return;
				}
				
				this.fire("update", data);
			},
		});
	}
	
	load() {
		return ipcRenderer.invoke("jsonStore", "load", this.key);
	}
	
	save(data) {
		return ipcRenderer.invoke("jsonStore", "save", this.key, data);
	}
}

module.exports = JsonStore;
