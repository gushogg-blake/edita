import multi from "@rollup/plugin-multi-entry";
import copy from "rollup-plugin-copy-watch";

import {dev, prod, watch} from "./env.js";
import {markBuildComplete, watchOptions} from "./utils.js";
import base from "./base.js";
import platformCommonPlugins, {copyTreeSitterWasm} from "./platformCommonPlugins.js";

let dir = "build/test";
	
export default [
	{
		input: "test/main.ts",
		
		output: {
			file: dir + "/main.js",
		},
		
		watch: watchOptions(),
		
		plugins: [
			...platformCommonPlugins("web"),
			copyTreeSitterWasm(dir),
			_copy(),
		],
	},
	
	{
		input: "test/tests/**/*.test.ts",
		
		watch: watchOptions(),
		
		output: {
			sourcemap: true,
			file: dir + "/tests.js",
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
