let cmdSync = require("../src/platforms/electron/mainProcess/utils/cmdSync");
let fs = require("../src/platforms/electron/mainProcess/modules/fs");
let langPackageMap = require("./langPackageMap");

process.chdir(__dirname + "/..");

(async function() {
	for (let [langCode, packagePath] of Object.entries(langPackageMap)) {
		cmdSync("npx tree-sitter build --wasm node_modules/" + packagePath);
		
		await fs("tree-sitter-" + langCode + ".wasm").move("vendor/public/tree-sitter/langs/");
	}
})();
