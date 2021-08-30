let {ipcRenderer} = require("electron");
let Evented = require("utils/Evented");

class Prefs extends Evented {
	constructor() {
		super();
		
		ipcRenderer.on("prefs/update", (e, prefs) => {
			this.fire("update", prefs);
		});
	}
	
	load() {
		return ipcRenderer.invoke("prefs/load");
	}
	
	save(prefs) {
		return ipcRenderer.invoke("prefs/save", prefs);
	}
}

module.exports = new Prefs();
