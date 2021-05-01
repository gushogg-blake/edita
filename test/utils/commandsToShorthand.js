module.exports = function(line) {
	return line.commands.map(function(command) {
		let [type, value] = command;
		
		if (type === "colour") {
			return "C" + value;
		} else if (type === "tab") {
			return "T" + value;
		} else if (type === "string") {
			return "S" + value;
		} else if (type === "open") {
			return "(" + value;
		} else if (type === "close") {
			return ")" + value;
		} else if (type === "error") {
			return "E" + value;
		}
	}).join(",");
}