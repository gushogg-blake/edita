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
	
	for (let command of line.commands) {
		let [type, value] = [command[0], command.substr(1)];
		
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
