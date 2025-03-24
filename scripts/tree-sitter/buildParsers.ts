import {cmdSync, fs} from "utils/node";

/*
some packages have the wasm file already built, some need building
*/

let prebuilt = {
	c: "tree-sitter-c",
	cpp: "tree-sitter-cpp",
	css: "tree-sitter-css",
	haskell: "tree-sitter-haskell",
	html: "tree-sitter-html",
	javascript: "tree-sitter-javascript",
	svelte: "@tree-sitter-grammars/tree-sitter-svelte",
	php: "tree-sitter-php",
	python: "tree-sitter-python",
	ruby: "tree-sitter-ruby",
	tsx: "tree-sitter-typescript",
	typescript: "tree-sitter-typescript",
};

let toBuild = {
	// commented langs have no tree-sitter.json, need updating to conform
	// to latest tree-sitter version
	//codepatterns: "@gushogg-blake/tree-sitter-codepatterns",
	//query: "@gushogg-blake/tree-sitter-query",
	//markdown: "@tree-sitter-grammars/tree-sitter-markdown/tree-sitter-markdown",
	//markdown_inline: "@tree-sitter-grammars/tree-sitter-markdown/tree-sitter-markdown-inline",
	//scss: "tree-sitter-scss",
	prisma: "tree-sitter-prisma",
};

let packages = [
	...Object.entries(prebuilt).map(([langCode, path]) => ({
		langCode,
		path,
		action: "copy",
	})),
	
	...Object.entries(toBuild).map(([langCode, path]) => ({
		langCode,
		path,
		action: "build",
	})),
];

process.chdir(import.meta.dirname);

let root = fs("../..");
let langsDir = root.child("vendor/public/tree-sitter/langs");

for (let {langCode, path, action} of packages) {
	let filename = "tree-sitter-" + langCode + ".wasm";
	
	if (await langsDir.child(filename).exists()) {
		continue;
	}
	
	if (action === "copy") {
		let prebuiltWasm = fs("node_modules").child(path, filename);
		
		console.log("Copying " + langCode + " from " + prebuiltWasm.path);
		console.log("");
		
		await prebuiltWasm.copy(langsDir);
	} else {
		console.log("Building " + langCode);
		console.log("");
		
		try {
			cmdSync("npx tree-sitter build --wasm node_modules/" + path);
			
			await fs(filename).move(langsDir);
		} catch (e) {
			console.log("Error when building parser for " + langCode);
			console.error(e);
		}
	}
	
	console.log("");
}
