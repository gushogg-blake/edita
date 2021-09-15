let {ipcRenderer} = require("electron");
let Evented = require("utils/Evented");

class Snippets extends Evented {
	load() {
		return ipcRenderer.invoke("snippets", "load");
	}
}

module.exports = new Snippets();
