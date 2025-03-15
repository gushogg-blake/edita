let {on, off} = require("utils/dom/domEvents");
let clickElementFromAccel = require("utils/dom/clickElementFromAccel");

function keydown(e) {
	clickElementFromAccel(e, {el: e.currentTarget});
}

export default function(node) {
	on(node, "keydown", keydown);
	
	return {
		destroy() {
			off(node, "keydown", keydown);
		},
	};
}
