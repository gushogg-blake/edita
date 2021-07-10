module.exports = function(line) {
	let cols = 0;
	
	cmds: for (let [type, value] of line.tokens) {
		if (type === "string") {
			for (let ch of value) {
				if (ch === " ") {
					cols++;
				} else {
					break cmds;
				}
			}
		} else if (type === "tab") {
			cols += value;
		}
	}
	
	return cols;
}
