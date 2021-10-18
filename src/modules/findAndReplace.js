let escapeRe = require("utils/escapeRe");
let createPlaceholderString = require("utils/createPlaceholderString");

function containsWordBoundary(str) {
	return !!str.match(/(\w\W|\W\w)/);
}

function parseRegexReplacePlaceholders(str) {
	let placeholders = [];
	let i = 0;
	
	while (i < str.length) {
		let ch = str[i];
		let next = str[i + 1];
		
		if (ch === "\\") {
			i += 2;
			
			continue;
		}
		
		if (ch === "@" && next.match(/\d/)) {
			let n = str.substr(i + 1).match(/^\d+/)[0];
			let length = 1 + n.length;
			
			placeholders.push({
				start: i,
				end: i + length,
				n: Number(n),
			});
			
			i += length;
			
			continue;
		}
		
		i++;
	}
	
	return placeholders;
}

function replaceRegexEscapes(str) {
	let result = "";
	let i = 0;
	
	while (i < str.length) {
		let ch = str[i];
		let next = str[i + 1];
		
		if (ch === "\\") {
			if (next === "r") {
				result += "\r";
			} else if (next === "n") {
				result += "\n";
			} else if (next === "t") {
				result += "\t";
			}
			
			i += 2;
		} else {
			result += ch;
			
			i++;
		}
	}
	
	return result;
}

function replaceGroupsForRegexReplace(str, groups) {
	let placeholders = parseRegexReplacePlaceholders(str);
	let replacedString = "";
	let prevPlaceholderEnd = 0;
	
	for (let placeholder of placeholders) {
		replacedString += str.substring(prevPlaceholderEnd, placeholder.start);
		replacedString += groups[placeholder.n - 1] || "";
		
		prevPlaceholderEnd = placeholder.end;
	}
	
	replacedString += str.substr(prevPlaceholderEnd);
	
	return replacedString;
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
		
		if (!options.search) {
			return;
		}
		
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
			let wildcardPlaceholder = createPlaceholderString(search);
			
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
					if (type === "regex") {
						str = replaceGroupsForRegexReplace(str, groups);
						str = replaceRegexEscapes(str);
					}
					
					code = code.substr(0, index) + str + code.substr(re.lastIndex);
					re.lastIndex = index + str.length;
					
					let diff = str.length - string.length;
					
					if (index < startIndex) {
						startIndex += diff;
					}
					
					if (endIndex !== null && index < endIndex) {
						endIndex += diff;
					}
					
					return str;
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
