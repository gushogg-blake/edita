import {dev, prod, watch} from "./env.js";
import base from "./base.js";

/*
common to the main entrypoints for web and electron (renderer)
*/

export default function(platform) {
	let dir = "build/" + (dev ? platform + "-dev" : platform);
	
	return [
		base.alias(),
		
		svelte({
			preprocess: preprocess({
				scss: {
					includePaths: ["src/css"],
				},
			}),
			
			compilerOptions: {
				dev,
			},
		}),
		
		base.externals(),
		
		base.resolve({
			browser: true,
			dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
		}),
		
		base.typescript(),
		
		prod && copy({
			targets: [
				{
					src: "package.json",
					dest: dir,
				},
			],
		}),
		
		copy({
			watch: watch && "node_modules/web-tree-sitter/tree-sitter.wasm",
			
			targets: [
				{
					src: "node_modules/web-tree-sitter/tree-sitter.wasm",
					dest: dir + "/vendor/tree-sitter",
				},
			],
		}),
		
		json(),
	];
}
