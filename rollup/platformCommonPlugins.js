import svelte from "rollup-plugin-svelte";
import copy from "rollup-plugin-copy-watch";
import scss from "rollup-plugin-scss";
import css from "rollup-plugin-css-only";

import svelteConfig from "../svelte.config.js";

import {dev, prod, watch} from "./env.js";
import {basePlugins} from "./base.js";
import commonPlugins from "./commonPlugins.js";

/*
common to the main entrypoints for web, electron (renderer), and test
*/

export default function(platform) {
	let dir = "build/" + (dev ? platform + "-dev" : platform);
	
	return [
		...commonPlugins,
		_svelte(),
		basePlugins.externals(),
		basePlugins.resolveBrowser(),
		basePlugins.typescript(),
		scss(),
		cssOnly(),
		basePlugins.commonjs(),
	];
}

function _svelte() {
	return svelte({
		...svelteConfig,
		
		compilerOptions: {
			...svelteConfig.compilerOptions,
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
