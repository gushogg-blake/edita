let {clipboard} = require("electron");

module.exports =  {
	read() {
		return clipboard.readText();
	},
	
	write(str) {
		clipboard.writeText(str);
	},
	
	readSelection() {
		return clipboard.readText("selection");
	},
	
	writeSelection(str) {
		clipboard.writeText(str, "selection");
	},
};
