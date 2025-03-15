module.exports = function(e) {
	let wheelCombo = "";
	let dir = e.deltaY > 0 || e.deltaX > 0 ? "down" : "up";
	let isModified = false;
	
	if (e.ctrlKey || e.metaKey) {
		isModified = true;
		wheelCombo += "Ctrl+";
	}
	
	if (e.altKey) {
		isModified = true;
		wheelCombo += "Alt+";
	}
	
	if (e.shiftKey) {
		wheelCombo += "Shift+";
	}
	
	wheelCombo += "Wheel";
	
	return {
		wheelCombo,
		dir,
		isModified,
	};
}
