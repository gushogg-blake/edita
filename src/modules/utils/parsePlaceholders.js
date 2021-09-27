/*
input: string

output:

	- string with placeholders replaced with default (for e.g. tabstops) or empty
	string
	- array of placeholder details - type, value, initialText (e.g. default value)
	and offset (index of initialText within the new string)
*/

module.exports = function(str) {
	let placeholders = [];
	let offset = 0;
	
	let string = str.replace(/\[\[%(tabstop)(\d*)(?::([^\]]*))?\]\]/g, function(match, type, id, value, index) {
		value = value || "";
		
		let replacement = "";
		
		if (type === "tabstop") {
			replacement = value;
			
			placeholders.push({
				type,
				id,
				value,
				initialText: replacement,
				offset: index - offset,
			});
		} else if (type === "ask") {
			// ...
		}
		
		offset += match.length - replacement.length;
		
		return replacement;
	});
	
	return {
		string,
		placeholders,
	};
}
