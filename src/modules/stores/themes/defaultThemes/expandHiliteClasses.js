let mapObjectInPlace = require("utils/mapObjectInPlace");
let _typeof = require("utils/typeof");

module.exports = function(theme) {
	for (let hiliteClasses of Object.values(theme.langs)) {
		mapObjectInPlace(hiliteClasses, function(value, key) {
			if (_typeof(value) === "String") {
				let [color, ...flags] = value.split(" ");
				let flag = (special, _default) => flags.includes(special) ? special : _default;
				
				value = {
					color,
					fontWeight: flag("bold", "normal"),
					fontStyle: flag("italic", "normal"),
					textDecoration: flag("underline", "none"),
				};
			}
			
			return value;
		});
	}
}
