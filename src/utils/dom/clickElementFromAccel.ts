let getKeyCombo = require("utils/getKeyCombo");

export default function(e, options) {
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
	
	for (let node of el.querySelectorAll("button, label")) {
		if (node.innerHTML.toLowerCase().includes("<u>" + key + "</u>")) {
			node.click();
			
			return true;
		}
	}
	
	return false;
}
