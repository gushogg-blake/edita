let ctoo = {
	")": "(",
	"]": "[",
	"}": "{",
	"`": "`",
};

module.exports = function(line) {
	let openers = [];
	let closers = [];
	
	for (let [type, value] of line.commands) {
		if (type === "open") {
			openers.push(value);
		} else if (type === "close") {
			if (openers[openers.length - 1] === ctoo[value]) {
				openers.pop();
			} else {
				closers.push(value);
			}
		}
	}
	
	return {
		openers,
		closers,
	};
}
