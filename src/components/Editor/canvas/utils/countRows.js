module.exports = function(lines) {
	let rows = 0;
	
	for (let line of lines) {
		rows += line.height;
	}
	
	return rows;
}
