import svelte from "rollup-plugin-svelte";
import preprocess from "svelte-preprocess";
import copy from "rollup-plugin-copy-watch";
import json from "@rollup/plugin-json";
import scss from "rollup-plugin-scss";
import css from "rollup-plugin-css-only";

import {dev, prod, watch} from "./env.js";
import base from "./base.js";

/*
common to the main entrypoints for web, electron (renderer), and test
*/

export default function(platform) {
	let dir = "build/" + (dev ? platform + "-dev" : platform);
	
	return [
		base.alias(),
		_svelte(),
		base.externals(),
		base.resolveBrowser(),
		base.typescript(),
		scss(),
		cssOnly(),
		base.commonjs(),
		json(),
	];
}

function _svelte() {
	return svelte({
		preprocess: preprocess({
			scss: {
				includePaths: ["src/css"],
			},
		}),
		
		compilerOptions: {
			dev,
		},
	});
}

function cssOnly() {
	return css({
		output: "main.css",
	});
}

export function copyPackageJson(dir) {
	return copy({
		targets: [
			{
				src: "package.json",
				dest: dir,
			},
		],
	});
}

export function copyTreeSitterWasm(dir) {
	return copy({
		watch: watch && "node_modules/web-tree-sitter/tree-sitter.wasm",
		
		targets: [
			{
				src: "node_modules/web-tree-sitter/tree-sitter.wasm",
				dest: dir + "/vendor/tree-sitter",
			},
		],
	});
}
