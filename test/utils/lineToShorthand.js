module.exports = function(line) {
	return [...line.render()].map(function([type, value]) {
		if (type === "string") {
			return "S" + value;
		} else if (type === "node") {
			return value.type + ":" + value.text;
		} else if (type === "colour") {
			return "C" + value;
		} else if (type === "tab") {
			return "T" + value;
		}
	}).join(",");
}
