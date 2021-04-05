module.exports = function(selection) {
	let {start, end} = selection;
	
	return start[0] !== end[0] || start[1] !== end[1];
}
