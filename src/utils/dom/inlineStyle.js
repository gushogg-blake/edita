function camelToCssProp(str) {
	return str.replace(/([A-Z])/g, (_, ch) => "-" + ch.toLowerCase());
}

let nonSizeProps = [
	"opacity",
	"flex-grow",
	"font-weight",
	"z-index",
];

module.exports = function(...styles) {
	let all = Object.assign({}, ...styles.flat());
	let str = "";
	
	for (let k in all) {
		let prop = camelToCssProp(k);
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
