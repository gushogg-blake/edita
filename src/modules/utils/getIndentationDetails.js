module.exports = function(indent, tabWidth) {
	let indentType = indent[0] === "\t" ? "tab" : "space";
	
	return {
		string: indent,
		re: new RegExp("^(" + indent + ")*"),
		colsPerIndent: indentType === "tab" ? indent.length * tabWidth : indent.length,
	};
}
