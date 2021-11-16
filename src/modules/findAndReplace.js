let escapeRe = require("utils/escapeRe");
let createPlaceholderString = require("utils/createPlaceholderString");
let getPlaceholders = require("modules/snippets/getPlaceholders");

function containsWordBoundary(str) {
	return !!str.match(/\W/);
}

function hasWordBoundaries(code, index, match) {
	return (
		index === 0
		|| containsWordBoundary(code.substr(index - 1, 2))
	) && (
		index + match.length === code.length
		|| containsWordBoundary(code.substr(index + match.length - 1, 2))
	);
}

function replaceExpressionsForRegexReplace(str, match) {
	let placeholders = getPlaceholders(str, false);
	
	let replacedString = "";
	let prevPlaceholderEnd = 0;
	
	for (let placeholder of placeholders) {
		replacedString += str.substring(prevPlaceholderEnd, placeholder.start);
		replacedString += placeholder.getValue(match) || "";
		
		prevPlaceholderEnd = placeholder.end;
	}
	
	replacedString += str.substr(prevPlaceholderEnd);
	
	return replacedString;
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

let findAndReplace = {
	*find(options) {
		let {
			code,
			search,
			type,
			caseMode,
			word = false,
			startIndex = null,
			rangeStartIndex = 0,
			rangeEndIndex = null,
			enumerate = false,
		} = options;
		
		if (startIndex === null) {
			startIndex = rangeStartIndex;
		}
		
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
			
			re = new RegExp(pattern, flags);
		} else if (type === "wildcard") {
			let pattern = search;
			let wildcardPlaceholder = createPlaceholderString(search);
			
			pattern = pattern.replace(/\*/g, wildcardPlaceholder);
			pattern = escapeRe(pattern);
			pattern = pattern.replace(wildcardPlaceholder, ".*");
			
			re = new RegExp(pattern, flags);
		} else if (type === "regex") {
			re = new RegExp(search, flags);
		}
		
		re.lastIndex = startIndex;
		
		let foundMatches = false;
		let loopedFile = false;
		let loopedResults = false;
		
		while (true) {
			let {lastIndex} = re;
			let match = re.exec(code);
			
			if (!match || rangeEndIndex !== null && match.index >= rangeEndIndex) {
				if (enumerate || !foundMatches) {
					break;
				}
				
				re.lastIndex = rangeStartIndex;
				
				match = re.exec(code);
				
				loopedFile = rangeEndIndex === null;
				loopedResults = true;
			}
			
			let [string, ...groups] = match;
			let {index} = match;
			
			if (word && !hasWordBoundaries(code, index, string)) {
				continue;
			}
			
			yield {
				index,
				match: string,
				groups,
				loopedFile,
				loopedResults,
				
				/*
				NOTE replace must be called while iterating through the
				generator, as it updates the string and regex index for the
				next iteration -- calling replace() on a result within a
				pre-generated array will invalidate subsequent results in
				the array.
				*/
				
				replace(str) {
					if (type === "regex") {
						str = replaceExpressionsForRegexReplace(str, match);
						str = replaceRegexEscapes(str);
					}
					
					code = code.substr(0, index) + str + code.substr(re.lastIndex);
					re.lastIndex = index + str.length;
					
					let diff = str.length - string.length;
					
					if (index < startIndex) {
						startIndex += diff;
					}
					
					if (rangeEndIndex !== null && index < rangeEndIndex) {
						rangeEndIndex += diff;
					}
					
					return str;
				},
			};
			
			foundMatches = true;
			loopedFile = false;
			loopedResults = false;
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
