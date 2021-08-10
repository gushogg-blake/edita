module.exports = function(indent, tabWidth) {
	let type = indent[0] === "\t" ? "tab" : "space";
	
	return {
		type,
		string: indent,
		re: new RegExp("^(" + indent + ")*"),
		colsPerIndent: type === "tab" ? indent.length * tabWidth : indent.length,
	};
}
