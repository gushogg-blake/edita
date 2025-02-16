let {cmdSync, fs} = require("utils/node");

let packages = {
	// commented langs have no tree-sitter.json, need updating to conform to latest tree-sitter version
	//codepatterns: "@gushogg-blake/tree-sitter-codepatterns",
	//query: "@gushogg-blake/tree-sitter-query",
	//markdown: "@tree-sitter-grammars/tree-sitter-markdown/tree-sitter-markdown",
	//markdown_inline: "@tree-sitter-grammars/tree-sitter-markdown/tree-sitter-markdown-inline",
	//svelte: "@tree-sitter-grammars/tree-sitter-svelte",
	c: "tree-sitter-c",
	cpp: "tree-sitter-cpp",
	css: "tree-sitter-css",
	haskell: "tree-sitter-haskell",
	html: "tree-sitter-html",
	javascript: "tree-sitter-javascript",
	php: "tree-sitter-php/php", // TODO might need to do lang injection with php_only, not sure how they've set it up
	//prisma: "tree-sitter-prisma",
	python: "tree-sitter-python",
	ruby: "tree-sitter-ruby",
	//scss: "tree-sitter-scss",
	tsx: "tree-sitter-typescript/tsx",
	typescript: "tree-sitter-typescript/typescript",
};

process.chdir(__dirname + "/..");

(async function() {
	for (let [langCode, packagePath] of Object.entries(packages)) {
		if (await fs("vendor/public/tree-sitter/langs").child("tree-sitter-" + langCode + ".wasm").exists()) {
			continue;
		}
		
		console.log(langCode);
		console.log("");
		
		try {
			cmdSync("npx tree-sitter build --wasm node_modules/" + packagePath);
			
			await fs("tree-sitter-" + langCode + ".wasm").move("vendor/public/tree-sitter/langs/", {
				mkdirs: true,
			});
		} catch (e) {
			console.log("Error when building parser for " + langCode);
			console.error(e);
		}
		
		console.log("");
	}
})();
