let {clipboard} = require("electron");

export default function(app) {
	return {
		read() {
			return clipboard.readText();
		},
		
		write(e, str) {
			clipboard.writeText(str);
		},
		
		readSelection() {
			if (process.platform !== "linux") {
				return "";
			}
			
			return clipboard.readText("selection");
		},
		
		writeSelection(e, str) {
			if (process.platform !== "linux") {
				return;
			}
			
			clipboard.writeText(str, "selection");
		},
	};
}
