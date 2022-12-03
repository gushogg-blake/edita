/*
parse a match description to find the bounds of tree-sitter queries
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
	let text = "";
	
	let i = 0;
	let ch;
	
	while (i < string.length) {
		ch = string[i];
		
		if (state === states.DEFAULT) {
			if (ch === "\\" && string[i + 1] === "(") {
				text += "(";
				
				i += 2;
			} else if (ch === "(") {
				openBrackets++;
				
				queryStartIndex = i;
				
				if (text.length > 0) {
					parts.push({
						type: "text",
						string: text,
					});
				}
				
				i++;
				
				state = states.IN_QUERY;
			} else {
				text += ch;
				
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
					
					text = "";
					
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
	
	if (text.length > 0) {
		parts.push({
			type: "text",
			string: text,
		});
	}
	
	return parts;
}

module.exports = parse;
