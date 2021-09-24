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

function containsWordBoundary(str) {
	return !!str.match(/(\w\W|\W\w)/);
}

let findAndReplace = {
	*find(options) {
		let {
			code,
			search,
			type,
			caseMode,
			word = false,
			startIndex = 0,
			endIndex = null,
			enumerate = false,
		} = options;
		
		let caseSensitive = (
			caseMode === "caseSensitive"
			|| caseMode === "smart" && search.match(/[A-Z]/)
		);
		
		let re;
		let flags = ["g", !caseSensitive ? "i" : ""].join("");
		
		if (type === "plain") {
			let pattern = escapeRe(search);
			
			if (word) {
				pattern = "\\b" + pattern + "\\b";
			}
			
			re = new RegExp(pattern, flags);
		} else if (type === "wildcard") {
			let pattern = search;
			let wildcardPlaceholder = generatePlaceholder(search);
			
			pattern = pattern.replace(/\*/g, wildcardPlaceholder);
			pattern = escapeRe(pattern);
			pattern = pattern.replace(wildcardPlaceholder, ".*");
			
			if (word) {
				pattern = "\\b" + pattern + "\\b";
			}
			
			re = new RegExp(pattern, flags);
		} else if (type === "regex") {
			re = new RegExp(search, flags);
		}
		
		re.lastIndex = startIndex;
		
		while (true) {
			let {lastIndex} = re;
			let match = re.exec(code);
			
			if (!match || endIndex !== null && match.index >= endIndex) {
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
			
			if (
				word
				&& type === "regex"
				&& (
					(
						index > 0
						&& !containsWordBoundary(code.substr(index - 1, 2))
					) || (
						index + string.length < code.length
						&& !containsWordBoundary(code.substr(index + string.length - 1, 2))
					)
				)
			) {
				continue;
			}
			
			yield {
				index,
				match: string,
				groups,
				
				/*
				NOTE replace must be called while iterating through the
				generator, as it updates the string and regex index for the
				next iteration -- calling replace() on a result within a
				pre-generated array will invalidate subsequent results in
				the array.
				*/
				
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

module.exports = findAndReplace;
