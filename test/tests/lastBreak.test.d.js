let fs = require("flowfs");
let {is, deep} = require("../utils/assertions");
let js = require("../../src/tokenisers/js");

describe("Test", function() {
	it("last", async function() {
		//let code = await fs("code.js").read();
		//
		//let {tokens} = js(code, {
		//	indentWidth: 4,
		//});
		//
		//let codeFromTokens = tokens.reduce(function(s, token) {
		//	let [type, value] = [token[0], token.substr(1)];
		//	
		//	if (type === "S" || type === "B") {
		//		s += value;
		//	} else if (type === "T") {
		//		s += "\t";
		//	} else if (type === "N") {
		//		s += "\n";
		//	}
		//	
		//	return s;
		//}, "");
		//	
		//if (codeFromTokens !== code) {
		//	console.log(code.length, codeFromTokens.length);
		//	
		//	//await fs("code.js").write(code);
		//	await fs("codeFromTokens.js").write(codeFromTokens);
		//	
		//	console.log(tokens.slice(150));
		//	
		//	//is(codeFromTokens, code);
		//}
	});
});
