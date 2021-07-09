let codeIntel = require("./codeIntel");
let parse = require("./parse");

module.exports = async function() {
	return {
		code: "js",
		codeIntel,
		parse: await parse(),
	};
}
