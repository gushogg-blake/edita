module.exports = function(code, dollarVariables) {
	code = code.replace(/\$\w+/g, function(match, index) {
		if (dollarVariables.includes(index)) {
			return `(context["${match.substr(1)}"] || "")`;
		} else {
			return match;
		}
	});
	
	return new Function("util", "context", `
		with (util) {
			with (context) {
				return ${code};
			}
		}
	`);
}
