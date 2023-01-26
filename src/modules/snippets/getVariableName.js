/*
add $ to numeric names to enable using them as variable names
in expressions
*/

module.exports = function(name) {
	return name.match(/^\d/) ? "$" + name : name;
}
