module.exports = function(lines, selection) {
	let options = ["test"];
	let [startLineIndex, endLineIndex] = selection;
	let headerLine = lines[startLineIndex];
	
	return options;
}
