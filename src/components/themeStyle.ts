let mapArrayToObject = require("utils/mapArrayToObject");
let inlineStyle = require("utils/dom/inlineStyle");

export default function(style) {
	return inlineStyle(mapArrayToObject(Object.entries(style), function([key, value]) {
		return ["--" + key, value];
	}));
}
