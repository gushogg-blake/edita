let fs = require("flowfs");
let {is, deep} = require("../utils/assertions");
let js = require("../../src/tokenisers/js");

describe("JS tokeniser", function() {
	it("repos", async function() {
		let files = await fs().glob("test/repos/**/*.js");
		
		for (let node of files) {
			if (!await node.isFile()) {
				continue;
			}
			
			let code = await node.read();
			
			let {tokens} = js({
				indentWidth: 4,
			}, code);
			
			let codeFromTokens = tokens.reduce(function(s, token) {
				let [type, value] = [token[0], token.substr(1)];
				
				if (type === "S" || type === "B") {
					s += value;
				} else if (type === "T") {
					s += "\t";
				} else if (type === "N") {
					s += "\n";
				}
				
				return s;
			}, "");
			
			try {
				is(codeFromTokens, code);
			} catch (e) {
				console.log(node.path);
				
				await fs("code.js").write(code);
				await fs("codeFromTokens.js").write(codeFromTokens);
				
				throw e;
			}
		}
	});
});
