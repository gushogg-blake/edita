module.exports = function(indent, tabWidth=4) {
	let type = indent[0] === "\t" ? "tab" : "space";
	
	return {
		type,
		string: indent,
		re: new RegExp("^(" + indent + ")*"),
		colsPerIndent: type === "tab" ? indent.length * tabWidth : indent.length,
	};
}
