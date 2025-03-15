/*
add $ to numeric names to enable using them as variable names
in expressions
*/

export default function(name) {
	return name.match(/^\d/) ? "$" + name : name;
}
