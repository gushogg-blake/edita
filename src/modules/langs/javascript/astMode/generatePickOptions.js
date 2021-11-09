let pickOptions = require("./pickOptions");

module.exports = function(document, selection) {
	let {lines} = document;
	let options = [];
	let {startLineIndex, endLineIndex} = selection;
	let headerLine = lines[startLineIndex];
	
	if (document.getHeadersOnLine(startLineIndex).length > 0) {
		//options.push(pickOptions.contents);
	}
	
	return options;
}
