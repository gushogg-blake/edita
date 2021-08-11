module.exports = {
	write(str) {
		return navigator.clipboard.writeText(str);
	},
	
	writeSelection() { // create a selection in a hidden input?
	},
	
	read() {
		return navigator.clipboard.readText();
	},
	
	readSelection() {
		return "";
	},
};
