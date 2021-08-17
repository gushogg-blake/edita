let {clipboard} = require("electron");

module.exports = function(app) {
	return {
		read() {
			return clipboard.readText();
		},
		
		write(e, str) {
			clipboard.writeText(str);
		},
		
		readSelection() {
			return clipboard.readText("selection");
		},
		
		writeSelection(e, str) {
			clipboard.writeText(str, "selection");
		},
	};
}
