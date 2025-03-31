import ClipboardCommon from "platforms/common/Clipboard";

class Clipboard extends ClipboardCommon {
	read() {
		return navigator.clipboard.readText();
	}
	
	async write(str) {
		await navigator.clipboard.writeText(str);
		
		this.fire("set", str);
	}
	
	readSelection() {
		return "";
	}
	
	writeSelection() {
	}
}

export default new Clipboard();
