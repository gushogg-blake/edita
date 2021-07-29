let escapeRe = require("../utils/escapeRe");

/*
generate a placeholder that doesn't appear in the given string
*/

function generatePlaceholder(string) {
	let placeholder;
	let n = 0;
	
	do {
		placeholder = "PLACEHOLDER_" + (++n);
	} while (string.indexOf(placeholder) !== -1);
	
	return placeholder;
}

module.exports = function*(code, find, type, caseMode, startIndex=0) {
	let caseSensitive = (
		caseMode === "caseSensitive"
		|| caseMode === "smart" && find.match(/[A-Z]/)
	);
	
	let re;
	let flags = ["g", !caseSensitive ? "i" : ""].join("");
	
	if (type === "plain") {
		re = new RegExp(escapeRe(find), flags);
	} else if (type === "wildcard") {
		let pattern = find;
		let wildcardPlaceholder = generatePlaceholder(find);
		
		pattern = pattern.replace(/\*/g, wildcardPlaceholder);
		pattern = escapeRe(pattern);
		pattern = pattern.replace(wildcardPlaceholder, ".*");
		
		re = new RegExp(pattern, flags);
	} else if (type === "regex") {
		re = new RegExp(find, flags);
	}
	
	re.lastIndex = startIndex;
	
	let looped = false;
	
	while (true) {
		let {lastIndex} = re;
		let match = re.exec(code);
		
		if (!match) {
			if (!looped) {
				re.lastIndex = 0;
				
				match = re.exec(code);
				
				looped = true;
			} else {
				break;
			}
		}
		
		if (!match) {
			break;
		}
		
		if (looped && match.index >= startIndex) {
			break;
		}
		
		let [string, ...groups] = match;
		let {index} = match;
		
		yield {
			index,
			match: string,
			groups,
			
			replace(str) {
				code = code.substr(0, index) + str + code.substr(re.lastIndex);
				re.lastIndex = index + str.length;
			},
		};
	}
}
