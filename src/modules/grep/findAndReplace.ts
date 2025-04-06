import escapeRe from "utils/escapeRe";
import mapArrayToObject from "utils/mapArrayToObject";
import createPlaceholderString from "utils/createPlaceholderString";
import getPlaceholders from "modules/snippets/getPlaceholders";

function containsWordBoundary(str) {
	return !!str.match(/\W/);
}

function hasWordBoundaries(code, match: RegExpMatchArray) {
	let [string] = match;
	let {index} = match;
	
	return (
		index === 0
		|| containsWordBoundary(code.substr(index - 1, 2))
	) && (
		index + string.length === code.length
		|| containsWordBoundary(code.substr(index + string.length - 1, 2))
	);
}

function replaceExpressionsForRegexReplace(str, match) {
	let placeholders = getPlaceholders(str, false);
	
	let replacedString = "";
	let prevPlaceholderEnd = 0;
	
	let context = mapArrayToObject(match, function(value, index) {
		return ["$" + index, value];
	});
	
	for (let placeholder of placeholders) {
		replacedString += str.substring(prevPlaceholderEnd, placeholder.start);
		replacedString += placeholder.getValue(context) || "";
		
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
			} else {
				result += next;
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
		let flags = ["g", !caseSensitive ? "i" : "", "m"].join("");
		
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
			try {
				re = new RegExp(search, flags);
			} catch (e) {
				console.log("Regex error");
				console.error(e);
				
				return null;
			}
		}
		
		re.lastIndex = startIndex;
		
		function findMatch() {
			let match;
			
			do {
				match = re.exec(code);
			} while (match && word && !hasWordBoundaries(code, match));
			
			if (
				!match
				|| rangeEndIndex !== null && match.index >= rangeEndIndex
			) {
				return null;
			}
			
			return match;
		}
		
		let loopedRange = false;
		let loopedResults = false;
		let loopedFile = false;
		let hasSetLoopedResults = false;
		let hasSetLoopedFile = false;
		let firstResultIndex = null;
		
		while (true) {
			let match = findMatch();
			
			if (!match) {
				if (enumerate && loopedRange) {
					break;
				}
				
				re.lastIndex = rangeStartIndex;
				
				match = findMatch();
				
				if (!match) {
					break;
				}
				
				loopedRange = true;
				loopedFile = rangeEndIndex === null;
				hasSetLoopedResults = false;
				hasSetLoopedFile = false;
			}
			
			// >= firstResultIndex as the first result might have been replaced
			loopedResults = loopedRange && match.index >= firstResultIndex;
			
			if (enumerate && loopedResults) {
				break;
			}
			
			let [string, ...groups] = match;
			let {index} = match;
			
			yield {
				index,
				match: string,
				groups,
				loopedFile: loopedFile && !hasSetLoopedFile,
				loopedResults: loopedResults && !hasSetLoopedResults,
				
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
			
			if (firstResultIndex === null) {
				firstResultIndex = index;
			}
			
			hasSetLoopedFile = loopedFile;
			hasSetLoopedResults = loopedResults;
			
			platform.loop(10000, {
				options,
				match,
				index,
				firstResultIndex,
				loopedFile,
				loopedRange,
				loopedResults,
			});
		}
		
		platform.resetLoop();
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
			prevResult = all.at(-1);
		} else {
			prevResult = all[resultIndex - 1];
		}
		
		return prevResult.index;
	},
};

export default findAndReplace;
