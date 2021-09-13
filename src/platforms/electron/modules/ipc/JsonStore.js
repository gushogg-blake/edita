let {ipcRenderer} = require("electron");
let Evented = require("utils/Evented");

class JsonStore extends Evented {
	constructor(key) {
		super();
		
		this.key = key;
		
		ipcRenderer.on("jsonStore/update", (e, key, data) => {
			if (key !== this.key) {
				return;
			}
			
			this.fire("update", data);
		});
	}
	
	load() {
		return ipcRenderer.invoke("jsonStore/load", this.key);
	}
	
	save(data) {
		return ipcRenderer.invoke("jsonStore/save", this.key, data);
	}
}

module.exports = JsonStore;
