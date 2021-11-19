import path from "path";

import multi from "@rollup/plugin-multi-entry";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import svelte from "rollup-plugin-svelte";
import scss from "rollup-plugin-scss";
import cssOnly from "rollup-plugin-css-only";
import {terser} from "rollup-plugin-terser";
import _delete from "rollup-plugin-delete";
import preprocess from "svelte-preprocess";
import builtins from "rollup-plugin-node-builtins";
import nodePolyfills from "rollup-plugin-polyfill-node";

let prod = !process.env.ROLLUP_WATCH;
let dev = !prod;
let root = __dirname;
let platform = process.env.PLATFORM;

function commonPlugins(platform) {
	return [
		alias({
			entries: {
				"components": path.join(root, "src/components"),
				"modules": path.join(root, "src/modules"),
				"utils": path.join(root, "src/utils"),
				"platforms": path.join(root, "src/platforms"),
				"platform": path.join(root, "src/platforms/" + platform),
				"vendor": path.join(root, "vendor"),
			},
		}),
		
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
		
		cssOnly({
			output: "main.css",
		}),
		
		resolve({
			browser: true,
			dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
		}),
	];
}

function electronPlugins() {
	return [
		...commonPlugins("electron"),
		
		commonjs({
			requireReturnsDefault: "preferred",
			
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
				"chokidar",
			],
		}),
		
		nodePolyfills({
			include: null,
		}),
		
		builtins(),
	];
}

function webPlugins() {
	return [
		...commonPlugins("web"),
		
		commonjs({
			requireReturnsDefault: "preferred",
		}),
	];
}

function addBuilds(...configs) {
	builds.push(...configs.map(config => ({
		onwarn() {},
		
		watch: {
			clearScreen: false,
		},
		
		...config,
	})));
}

function globalCssBuild(path) {
	return {
		input: "src/css/globalCss.js",
		
		output: {
			format: "iife",
			file: path,
		},
		
		plugins: [
			scss(),
			
			_delete({
				targets: [path],
				hook: "buildEnd",
			}),
		],
	};
}

let builds = [];

if (!platform || platform === "all" || platform === "electron") {
	let dir = "build/" + (dev ? "electron-dev" : "electron");
	
	addBuilds(globalCssBuild(dir + "/css/global.js"), {
		input: "src/platforms/electron/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: dir + "/js/main.js",
		},
		
		plugins: [
			...electronPlugins(),
			
			copy({
				targets: [
					{
						src: "src/platforms/electron/public/*",
						dest: dir,
					},
					{
						src: "vendor/public/*",
						dest: dir + "/vendor",
					},
				],
			}),
		],
	}, {
		input: "src/platforms/electron/dialogs/messageBox/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: dir + "/js/dialogs/messageBox/main.js",
		},
		
		plugins: electronPlugins(),
	}, {
		input: "src/platforms/electron/dialogs/snippetEditor/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: dir + "/js/dialogs/snippetEditor/main.js",
		},
		
		plugins: electronPlugins(),
	}, {
		input: "src/platforms/electron/dialogs/findAndReplace/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: dir + "/js/dialogs/findAndReplace/main.js",
		},
		
		plugins: electronPlugins(),
	});
}

if (!platform || platform === "all" || platform === "web") {
	let dir = "build/" + (dev ? "web-dev" : "web");
	
	addBuilds(globalCssBuild(dir + "/css/global.js"), {
		input: "src/platforms/web/main.js",
		
		output: {
			sourcemap: dev,
			format: "iife",
			name: "editor",
			file: dir + "/js/main.js",
		},
		
		plugins: [
			...webPlugins(),
			
			copy({
				targets: [
					{
						src: "src/platforms/web/public/*",
						dest: dir,
					},
					{
						src: "vendor/public/*",
						dest: dir + "/vendor",
					},
				],
			}),
			
			dev && livereload(dir),
			prod && terser(),
		],
	});
}

if (!platform || platform === "all" || platform === "test") {
	addBuilds({
		input: "test/main.js",
		
		output: {
			format: "iife",
			file: "build/test/js/main.js",
			name: "main",
		},
		
		plugins: [
			...webPlugins(),
			
			copy({
				targets: [
					{
						src: "test/public/*",
						dest: "build/test",
					},
					{
						src: "vendor/public/*",
						dest: "build/test/vendor",
					},
					{
						src: "node_modules/mocha/mocha.css",
						dest: "build/test/vendor/mocha",
					},
					{
						src: "node_modules/mocha/mocha.js",
						dest: "build/test/vendor/mocha",
					},
				],
			}),
		],
	}, {
		input: "test/tests/**/*.test.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: "build/test/js/tests.js",
		},
		
		plugins: [
			multi(),
			...webPlugins(),
		],
	});
}

export default builds;
