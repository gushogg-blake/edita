let escapeRe = require("utils/escapeRe");

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

let api = {
	*find(code, search, type, caseMode, startIndex, enumerate=false) {
		let caseSensitive = (
			caseMode === "caseSensitive"
			|| caseMode === "smart" && search.match(/[A-Z]/)
		);
		
		let re;
		let flags = ["g", !caseSensitive ? "i" : ""].join("");
		
		if (type === "plain") {
			re = new RegExp(escapeRe(search), flags);
		} else if (type === "wildcard") {
			let pattern = search;
			let wildcardPlaceholder = generatePlaceholder(search);
			
			pattern = pattern.replace(/\*/g, wildcardPlaceholder);
			pattern = escapeRe(pattern);
			pattern = pattern.replace(wildcardPlaceholder, ".*");
			
			re = new RegExp(pattern, flags);
		} else if (type === "regex") {
			re = new RegExp(search, flags);
		}
		
		re.lastIndex = startIndex;
		
		while (true) {
			let {lastIndex} = re;
			let match = re.exec(code);
			
			if (!match) {
				if (enumerate) {
					break;
				}
				
				re.lastIndex = 0;
				
				match = re.exec(code);
			}
			
			if (!match) {
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
					
					return code;
				},
			};
		}
	},
	
	/*
	get the index of the previous result
	
	(to go to the previous result ("find previous"), we create a new generator
	starting at the previous index - this avoids having to save results, step
	forward and backward through them and adjust subsequent results when
	replacing.)
	*/
	
	previousIndex(result, all) {
		if (all.length < 2) {
			return null;
		}
		
		let resultIndex = all.findIndex(r => r.index === result.index);
		let prevResult;
		
		if (resultIndex === 0) {
			prevResult = all[all.length - 1];
		} else {
			prevResult = all[resultIndex - 1];
		}
		
		return prevResult.index;
	},
};

module.exports = api;
