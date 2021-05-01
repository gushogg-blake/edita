let allOpeners = "([{";
let allClosers = ")]}";

let ctoo = {
	")": "(",
	"]": "[",
	"}": "{",
};

module.exports = function(line) {
	let openers = [];
	let closers = [];
	
	for (let [type, value] of line.commands) {
		if (type !== "B") {
			continue;
		}
		
		if (allOpeners.includes(value)) {
			openers.push(value);
		}
		
		if (allClosers.includes(value)) {
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
