/*
parse a match description to find the bounds of tree-sitter queries
*/

let states = {
	DEFAULT: "_",
	IN_QUERY: "Q",
};

function parse(string) {
	let queries = [];
	
	let state = states.DEFAULT;
	let openBrackets = 0; // open brackets within a query - if we see ) and this is 1, we've reached the closing )
	
	let queryStartIndex;
	let i = 0;
	let ch;
	
	while (i < string.length) {
		ch = string[i];
		
		if (state === states.DEFAULT) {
			if (ch === "\\") {
				i += 2;
			} else if (ch === "(") {
				openBrackets++;
				
				queryStartIndex = i;
				
				i++;
				
				state = states.IN_QUERY;
			} else {
				i++;
			}
		} else if (state === states.IN_QUERY) {
			if (ch === "(") {
				openBrackets++;
				
				i++;
			} else if (ch === ")") {
				openBrackets--;
				
				i++;
				
				if (openBrackets === 0) {
					queries.push({
						startIndex: queryStartIndex,
						endIndex: i,
					});
					
					state = states.DEFAULT;
				}
			} else if (ch === ";") {
				i++;
						
				while (i < string.length && !"\r\n".includes(string[i])) {
					i++;
				}
			} else if (ch === "\"") {
				i++;
				
				while (i < string.length) {
					ch = string[i];
					
					if (ch === "\\") {
						i += 2;
						
						continue;
					} else if (ch === "\"" || ch === "\r" || ch === "\n") {
						i++;
						
						break;
					} else {
						i++;
					}
				}
			} else {
				i++;
			}
		}
	}
	
	return queries;
}

module.exports = parse;
