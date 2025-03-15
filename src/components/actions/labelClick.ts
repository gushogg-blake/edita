let {on, off} = require("utils/dom/domEvents");
let clickElementFromAccel = require("utils/dom/clickElementFromAccel");

/*
allow labels to point to non-form elements
*/

function click(e) {
	let node = e.target;
	
	while (node && node.nodeName.toLowerCase() !== "label") {
		node = node.parentElement;
	}
	
	if (!node) {
		return;
	}
	
	let id = node.getAttribute("for");
	let el = document.getElementById(id);
	
	if (el && !["input", "select", "textarea"].includes(el.nodeName.toLowerCase())) {
		el.focus();
	}
}

export default function(node) {
	on(node, "click", click);
	
	return {
		destroy() {
			off(node, "click", click);
		},
	};
}
