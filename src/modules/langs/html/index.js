let codeIntel = require("./codeIntel");
let {parse, stateColors} = require("./parse");

module.exports = async function() {
	return {
		code: "html",
		parse,
		stateColors,
		codeIntel,
	};
}
