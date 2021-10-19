let pickOptions = require("./pickOptions");

module.exports = function(document, selection) {
	let {lines} = document;
	let options = [pickOptions.test];
	let {startLineIndex, endLineIndex} = selection;
	let headerLine = lines[startLineIndex];
	
	return options;
}
