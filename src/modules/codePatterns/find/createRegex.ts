let ParseError = require("./ParseError");

export default function() {
	let cache = {};
	
	return function(pattern, flags) {
		/*
		add start assertion if necessary to anchor the regex to the current
		index, and remove g flag if present - we're only interested in a
		single match at the current index
		*/
		
		if (pattern[0] !== "^") {
			pattern = "^" + pattern;
		}
		
		flags = flags.replace("g", "");
		
		if (!cache[pattern]) {
			cache[pattern] = {};
		}
		
		if (!cache[pattern][flags]) {
			try {
				cache[pattern][flags] = new RegExp(pattern, flags);
			} catch (e) {
				throw new ParseError("Regex syntax error", {
					cause: e,
				});
			}
		}
		
		return cache[pattern][flags];
	}
}
