import {on, off} from "utils/dom/domEvents";
import clickElementFromAccel from "utils/dom/clickElementFromAccel";

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
