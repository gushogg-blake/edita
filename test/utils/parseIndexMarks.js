/*
parse <@name> marks in a string and return a map of names to indexes

e.g.

"a<@mark1>b<@mark2>"

{
	string: "ab",
	marks: {
		mark1: 1,
		mark2: 2,
	},
}
*/

module.exports = function(str) {
	let marks = {};
	let offset = 0;
	
	let string = str.replace(/<@([^>]+)>/g, function(match, name, index) {
		marks[name] = index - offset;
		offset += match.length;
		
		return "";
	});
	
	return {
		string,
		marks,
	};
}
