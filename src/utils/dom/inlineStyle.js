let flatten = require("../array/flatten");
let camelToKebab = require("../camelToKebab");

let nonSizeProps = [
	"opacity",
	"flex-grow",
	"font-weight",
];

module.exports = function(...styles) {
	let all = Object.assign({}, ...flatten(styles));
	let str = "";
	
	for (let k in all) {
		let prop = camelToKebab(k);
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
