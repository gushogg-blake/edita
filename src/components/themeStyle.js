let mapArrayToObject = require("utils/mapArrayToObject");
let inlineStyle = require("utils/dom/inlineStyle");

module.exports = function(theme) {
	return inlineStyle(mapArrayToObject(Object.entries(theme.app), function([key, value]) {
		return ["--" + key, value];
	}));
}