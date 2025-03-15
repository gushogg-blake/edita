export default function(e) {
	let keyCombo = "";
	let isModified = false;
	
	if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
		if (e.ctrlKey || e.metaKey) {
			isModified = true;
			keyCombo += "Ctrl+";
		}
		
		if (e.altKey) {
			isModified = true;
			keyCombo += "Alt+";
		}
		
		if ((isModified || e.key.length !== 1) && e.shiftKey) {
			isModified = true;
			
			if (e.key === " " || e.key.match(/\w/)) {
				keyCombo += "Shift+";
			}
		}
	}
	
	if (e.code === "Space") {
		keyCombo += "Space";
	} else {
		keyCombo += isModified && e.key.length === 1 ? e.key.toUpperCase() : e.key;
	}
	
	return {
		keyCombo,
		isModified,
	};
}
