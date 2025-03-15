let mapObjectInPlace = require("utils/mapObjectInPlace");
let _typeof = require("utils/typeof");

function expand(value) {
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
}

export default function(theme) {
	for (let hiliteClasses of Object.values(theme.langs)) {
		mapObjectInPlace(hiliteClasses, expand);
	}
	
	theme.editor.defaultStyle = expand(theme.editor.defaultStyle);
}
