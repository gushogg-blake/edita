let _typeof = require("utils/typeof");

export default function(array, field, _default=null) {
	let obj = {};
		
	for (let item of array) {
		let key = _typeof(field) === "Function" ? field(item) : item[field];
		
		key = key || _default;
		
		if (!key) {
			continue;
		}
		
		if (!obj[key]) {
			obj[key] = [];
		}
		
		obj[key].push(item);
	}
	
	return obj;
}
