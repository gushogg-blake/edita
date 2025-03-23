import multi from "@rollup/plugin-multi-entry";
import copy from "rollup-plugin-copy-watch";

import {dev, prod, watch} from "./env.js";
import {markBuildComplete} from "./utils.js";
import {baseConfig} from "./base.js";
import platformCommonPlugins, {copyTreeSitterWasm} from "./platformCommonPlugins.js";

let dir = "build/test";
	
export default [
	{
		...baseConfig,
		
		input: "test/main.ts",
		
		output: {
			file: dir + "/main.js",
			format: "iife",
			name: "main",
		},
		
		plugins: [
			...platformCommonPlugins("web"),
			copyTreeSitterWasm(dir),
			_copy(),
		],
	},
	
	{
		...baseConfig,
		
		input: "test/tests/**/*.test.ts",
		
		output: {
			sourcemap: true,
			file: dir + "/tests.js",
			format: "iife",
		},
		
		plugins: [
			multi(),
			...platformCommonPlugins("web"),
			markBuildComplete(dir),
		],
	},
];

function _copy() {
	return copy({
		watch: watch && "test/public",
		
		targets: [
			{
				src: "test/public/*",
				dest: dir,
			},
			{
				src: "vendor/public/*",
				dest: dir + "/vendor",
			},
			{
				src: "node_modules/mocha/mocha.css",
				dest: dir + "/vendor/mocha",
			},
			{
				src: "node_modules/mocha/mocha.js",
				dest: dir + "/vendor/mocha",
			},
		],
	});
}
