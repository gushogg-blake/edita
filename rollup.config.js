import path from "path";

import multi from "@rollup/plugin-multi-entry";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy";

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import svelte from "rollup-plugin-svelte";
import cssOnly from "rollup-plugin-css-only";
import {terser} from "rollup-plugin-terser";
import preprocess from "svelte-preprocess";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import scss from "rollup-plugin-scss";

let production = !process.env.ROLLUP_WATCH;
let root = __dirname;
let platform = process.env.PLATFORM;

let commonPlugins = function() {
	return [
		alias({
			entries: {
				"components": path.resolve(root, "src/components"),
				"modules": path.resolve(root, "src/modules"),
				"utils": path.resolve(root, "src/utils"),
				"platforms": path.resolve(root, "src/platforms"),
			},
		}),
		
		svelte({
			preprocess: preprocess({
				scss: {
					includePaths: ["src/css"],
				},
			}),
			
			compilerOptions: {
				dev: !production,
			},
		}),
		
		cssOnly({
			output: "main.css",
		}),
		
		resolve({
			browser: true,
			dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
		}),
	];
}

let electronPlugins = function() {
	return [
		...commonPlugins(),
		
		commonjs({
			ignore: [
				"os",
				"fs",
				"fs-extra",
				"glob",
				"path",
				"constants",
				"util",
				"stream",
				"assert",
				"string_decoder",
				"buffer",
				"events",
				"electron",
				"query-string",
			],
		}),
		
		globals(),
		builtins(),
	];
}

let platforms = [];

if (!platform || platform === "all" || platform === "test") {
	platforms.push({
		input: "node_modules/mocha/mocha.js",
		
		output: {
			format: "iife",
			file: "test/public/build/mocha.js",
		},
		
		plugins: [
			...commonPlugins(),
			commonjs(),
		],
	}, {
		input: "test/main.js",
		
		output: {
			format: "iife",
			file: "test/public/build/main.js",
			name: "main",
		},
		
		plugins: [
			...commonPlugins(),
			commonjs(),
			
			copy({
				targets: [
					{
						src: "node_modules/mocha/mocha.css",
						dest: "test/public/build",
					},
					{
						src: "node_modules/mocha/mocha.js",
						dest: "test/public/build",
					},
				],
			}),
		],
	}, {
		input: "test/tests/**/*.test.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: "test/public/build/tests.js",
		},
		
		plugins: [
			multi(),
			...commonPlugins(),
			commonjs(),
			livereload("test/public"),
		],
	});
}

if (!platform || platform === "all" || platform === "electron") {
	platforms.push({
		input: "src/platforms/common/public/globalCss.js",
		
		output: {
			format: "iife",
			file: "src/platforms/electron/public/build/globalCss.js",
		},
		
		plugins: [
			scss(),
		],
	}, {
		input: "src/platforms/electron/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: "src/platforms/electron/public/build/main.js",
		},
		
		plugins: electronPlugins(),
	}, {
		input: "src/platforms/electron/dialogs/snippetEditor/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: "src/platforms/electron/public/build/dialogs/snippetEditor/main.js",
		},
		
		plugins: electronPlugins(),
	}, {
		input: "src/platforms/electron/dialogs/findAndReplace/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: "src/platforms/electron/public/build/dialogs/findAndReplace/main.js",
		},
		
		plugins: electronPlugins(),
	});
}

if (!platform || platform === "all" || platform === "web") {
	platforms.push({
		input: "src/platforms/common/public/globalCss.js",
		
		output: {
			format: "iife",
			file: "src/platforms/web/public/build/globalCss.js",
		},
		
		plugins: [
			scss(),
		],
	}, {
		input: "src/platforms/web/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			name: "editor",
			file: "src/platforms/web/public/build/main.js",
		},
		
		plugins: [
			...commonPlugins(),
			commonjs(),
			!production && livereload("src/platforms/web/public"),
			production && terser(),
		],
	});
}

export default platforms;
