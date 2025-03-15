function cssProp(str) {
	return str.startsWith("--") ? str : str.replace(/([A-Z])/g, (_, ch) => "-" + ch.toLowerCase());
}

let nonSizeProps = [
	"opacity",
	"flex-grow",
	"font-weight",
	"z-index",
];

function inlineStyle(...styles) {
	let all = Object.assign({}, ...styles.flat());
	let str = "";
	
	for (let k in all) {
		let prop = cssProp(k);
		let value = all[k];
		
		if (typeof value === "number" && value !== 0 && !nonSizeProps.includes(prop)) {
			value += "px";
		}
		
		if (value !== undefined) {
			str += prop + ": " + value + ";";
		}
	}
	
	return str;
}

inlineStyle.assign = function(node, ...styles) {
	let all = Object.assign({}, ...styles.flat());
	
	for (let k in all) {
		let prop = cssProp(k);
		let value = all[k];
		
		if (typeof value === "number" && value !== 0 && !nonSizeProps.includes(prop)) {
			value += "px";
		}
		
		if (value !== undefined) {
			node.style[prop] = value;
		}
	}
}

module.exports = inlineStyle;
