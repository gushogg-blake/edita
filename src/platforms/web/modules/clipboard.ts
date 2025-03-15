module.exports = {
	read() {
		return navigator.clipboard.readText();
	},
	
	write(str) {
		return navigator.clipboard.writeText(str);
	},
	
	readSelection() {
		return "";
	},
	
	writeSelection() {
	},
};
