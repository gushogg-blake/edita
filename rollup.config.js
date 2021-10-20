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

function onwarn() {
	
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
	builds.push(globalCssBuild("src/platforms/electron/public/build/global.js"), {
		input: "src/platforms/electron/main.js",
		
		output: {
			sourcemap: dev,
			format: "iife",
			file: "src/platforms/electron/public/build/main.js",
		},
		
		plugins: electronPlugins(),
		
		onwarn,
	}, {
		input: "src/platforms/electron/dialogs/messageBox/main.js",
		
		output: {
			sourcemap: dev,
			format: "iife",
			file: "src/platforms/electron/public/build/dialogs/messageBox/main.js",
		},
		
		plugins: electronPlugins(),
		
		onwarn,
	}, {
		input: "src/platforms/electron/dialogs/snippetEditor/main.js",
		
		output: {
			sourcemap: dev,
			format: "iife",
			file: "src/platforms/electron/public/build/dialogs/snippetEditor/main.js",
		},
		
		plugins: electronPlugins(),
		
		onwarn,
	}, {
		input: "src/platforms/electron/dialogs/findAndReplace/main.js",
		
		output: {
			sourcemap: dev,
			format: "iife",
			file: "src/platforms/electron/public/build/dialogs/findAndReplace/main.js",
		},
		
		plugins: electronPlugins(),
		
		onwarn,
	});
}

if (!platform || platform === "all" || platform === "web") {
	builds.push(globalCssBuild("src/platforms/web/public/build/global.js"), {
		input: "src/platforms/web/main.js",
		
		output: {
			sourcemap: dev,
			format: "iife",
			name: "editor",
			file: "src/platforms/web/public/build/" + (dev ? "main.js" : "main.min.js"),
		},
		
		plugins: [
			...commonPlugins("web"),
			commonjs(),
			dev && livereload("src/platforms/web/public"),
			prod && terser(),
		],
		
		onwarn,
	});
}

if (!platform || platform === "all" || platform === "test") {
	builds.push({
		input: "test/main.js",
		
		output: {
			format: "iife",
			file: "test/public/build/main.js",
			name: "main",
		},
		
		plugins: [
			...commonPlugins("test"),
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
		
		onwarn,
	}, {
		input: "test/tests/**/*.test.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: "test/public/build/tests.js",
		},
		
		plugins: [
			multi(),
			...commonPlugins("test"),
			commonjs(),
		],
		
		onwarn,
	});
}

export default builds;
