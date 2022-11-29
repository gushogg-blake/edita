let mapObject = require("utils/mapObject");
let _typeof = require("utils/typeof");

module.exports = function(hiliteClasses) {
	return mapObject(hiliteClasses, function(value, key) {
		if (_typeof(value) === "String") {
			value = {
				color: value,
				fontWeight: "normal",
				fontStyle: "normal",
				textDecoration: "none",
			};
		}
		
		return value;
	});
}
