import mapArrayToObject from "utils/mapArrayToObject";
import inlineStyle from "utils/dom/inlineStyle";

export default function(style) {
	return inlineStyle(mapArrayToObject(Object.entries(style), function([key, value]) {
		return ["--" + key, value];
	}));
}
