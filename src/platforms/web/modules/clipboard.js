module.exports = {
	write(str) {
		return navigator.clipboard.writeText(str);
	},
	
	writeSelection() {
	},
	
	read() {
		return navigator.clipboard.readText();
	},
	
	readSelection() {
		return "";
	},
};
