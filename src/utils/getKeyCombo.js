module.exports = function(e) {
	let str = "";
	let modified = false;
	
	if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
		if (e.ctrlKey || e.metaKey) {
			modified = true;
			str += "Ctrl+";
		}
		
		if (e.altKey) {
			modified = true;
			str += "Alt+";
		}
		
		if ((modified || e.key.length !== 1) && e.shiftKey) {
			modified = true;
			str += "Shift+";
		}
	}
	
	str += modified && e.key.length === 1 ? e.key.toUpperCase() : e.key;
	
	return str;
}
