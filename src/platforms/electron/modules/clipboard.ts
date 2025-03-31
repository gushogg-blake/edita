import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import ClipboardCommon from "platforms/common/Clipboard";

/*
note - these methods are sync, but code should treat platform.clipboard
methods as async as they are async on web
*/

class Clipboard extends ClipboardCommon {
	read() {
		return ipcRenderer.sendSync("clipboard", "read");
	}
	
	async write(str) {
		await ipcRenderer.sendSync("clipboard", "write", str);
		
		this.fire("set", str);
	}
	
	readSelection() {
		return ipcRenderer.sendSync("clipboard", "readSelection");
	}
	
	writeSelection(str) {
		return ipcRenderer.sendSync("clipboard", "writeSelection", str);
	}
}

export default new Clipboard();
