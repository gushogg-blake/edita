let {cmdSync, fs} = require("../common/node");
let langPackageMap = require("./langPackageMap");

process.chdir(__dirname + "/..");

(async function() {
	for (let [langCode, packagePath] of Object.entries(langPackageMap)) {
		try {
			cmdSync("npx tree-sitter build --wasm node_modules/" + packagePath);
			
			await fs("tree-sitter-" + langCode + ".wasm").move("vendor/public/tree-sitter/langs/", {
				mkdirs: true,
			});
		} catch (e) {
			console.log("Error when building parser for " + langCode);
			console.error(e);
		}
	}
})();
