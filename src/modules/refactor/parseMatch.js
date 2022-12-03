/*
parse a match description to separate the literals and the queries

an unescaped ( starts a query and its closing ) closes it -- opening
brackets in code must be escaped, e.g. fn\()
*/

let states = {
	DEFAULT: "_",
	IN_QUERY: "Q",
};

function parse(string) {
	let parts = [];
	
	let state = states.DEFAULT;
	let openBrackets = 0; // open brackets within a query - if we see ) and this is 1, we've reached the closing )
	
	let queryStartIndex;
	let lastQueryEndIndexOrStart = 0;
	let literal = "";
	
	let i = 0;
	let ch;
	
	while (i < string.length) {
		ch = string[i];
		
		if (state === states.DEFAULT) {
			if (ch === "\\") {
				literal += string[i + 1] || "";
				
				i += 2;
			} else if (ch === "(") {
				openBrackets++;
				
				queryStartIndex = i;
				
				if (literal.length > 0) {
					parts.push({
						type: "literal",
						string: literal,
					});
				}
				
				i++;
				
				state = states.IN_QUERY;
			} else {
				literal += ch;
				
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
					parts.push({
						type: "query",
						string: string.substring(queryStartIndex, i),
					});
					
					literal = "";
					
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
	
	if (openBrackets > 0) {
		throw new Error("Unterminated query - expecting closing )");
	}
	
	if (literal.length > 0) {
		parts.push({
			type: "literal",
			string: literal,
		});
	}
	
	return parts;
}

module.exports = parse;
