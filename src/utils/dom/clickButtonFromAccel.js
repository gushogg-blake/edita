let getKeyCombo = require("utils/getKeyCombo");

module.exports = function(e) {
	let {keyCombo} = getKeyCombo(e);
	let match = keyCombo.match(/^Alt\+(\w)$/);
	
	if (!match) {
		return false;
	}
	
	let key = match[1].toLowerCase();
	let buttons = [...document.body.querySelectorAll("button")];
	
	for (let button of buttons) {
		if (button.innerHTML.toLowerCase().includes("<u>" + key + "</u>")) {
			button.click();
			
			return true;
		}
	}
	
	return false;
}
