let getKeyCombo = require("utils/getKeyCombo");

module.exports = function(e, noAlt=false) {
	let {keyCombo} = getKeyCombo(e);
	let key = null;
	let match = keyCombo.match(/^Alt\+(\w)$/);
	
	if (match) {
		key = match[1].toLowerCase();
	} else if (noAlt) {
		key = keyCombo.toLowerCase();
	}
	
	if (!key) {
		return false;
	}
	
	let buttons = [...document.body.querySelectorAll("button")];
	
	for (let button of buttons) {
		if (button.innerHTML.toLowerCase().includes("<u>" + key + "</u>")) {
			button.click();
			
			return true;
		}
	}
	
	return false;
}
