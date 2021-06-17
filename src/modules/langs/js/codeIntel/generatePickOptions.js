let pickOptions = require("./pickOptions");

module.exports = function(lines, selection) {
	let options = [pickOptions.test];
	let [startLineIndex, endLineIndex] = selection;
	let headerLine = lines[startLineIndex];
	
	return options;
}
