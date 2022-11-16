let getKeyCombo = require("utils/getKeyCombo");

module.exports = function(e, options) {
	options = {
		noAlt: false,
		el: document.body,
		...options,
	};
	
	let {el, noAlt} = options;
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
	
	for (let button of el.querySelectorAll("button")) {
		if (button.innerHTML.toLowerCase().includes("<u>" + key + "</u>")) {
			button.click();
			
			return true;
		}
	}
	
	return false;
}
