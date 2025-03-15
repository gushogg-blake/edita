import {spawnSync} from "node:child_process";

import typescript from "@rollup/plugin-typescript";
import scss from "rollup-plugin-scss";
import preprocess from "svelte-preprocess";
import multi from "@rollup/plugin-multi-entry";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy-watch";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import svelte from "rollup-plugin-svelte";
import cssOnly from "rollup-plugin-css-only";
import _delete from "rollup-plugin-delete";

let dev = process.env.NODE_ENV === "development";
let prod = !dev;
let watch = process.env.ROLLUP_WATCH;
let root = import.meta.dirname;
let platform = process.env.PLATFORM || "all";

/*
mark builds as complete for ./scripts/await-build
*/

function markBuildComplete(dir) {
	return {
		name: "internal-mark-build-complete",
		
		generateBundle() {
			spawnSync("touch", [dir + "/.build-complete"], {
				stdio: "inherit",
				shell: true,
			});
		},
	};
}

function watchOptions() {
	return {
		clearScreen: false,
		buildDelay: 100,
		
		chokidar: {
			usePolling: true,
		},
	};
}

function commonPlugins(platform) {
	let dir = "build/" + (dev ? platform + "-dev" : platform);
	
	return [
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
		
		typescript(),
		
		copy({
			watch: watch && "package.json",
			
			targets: [
				{
					src: "package.json",
					dest: dir,
				},
			],
		}),
		
		copy({
			watch: watch && "node_modules/web-tree-sitter/tree-sitter.js",
			
			targets: [
				{
					src: "node_modules/web-tree-sitter/tree-sitter.*",
					dest: dir + "/vendor/tree-sitter",
				},
			],
		}),
		
		json(),
	];
}

/*
TODO do we need to add node: to these?
*/

let nodeIgnore = [
	"os",
	"child_process",
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
	"yargs",
];

function electronPlugins() {
	return [
		...commonPlugins("electron"),
		
		commonjs({
			requireReturnsDefault: "preferred",
			ignore: nodeIgnore,
		}),
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
		
		watch: watchOptions(),
		
		...config,
	})));
}

function globalCssBuild(path) {
	return {
		input: "src/css/globalCss.ts",
		
		output: {
			file: path,
		},
		
		plugins: [
			typescript(),
			scss(),
			
			_delete({
				targets: [path],
				hook: "buildEnd",
			}),
		],
	};
}

let builds = [];

if (platform === "all" || platform === "electron") {
	let dir = "build/" + (dev ? "electron-dev" : "electron");
	
	addBuilds(
		globalCssBuild(dir + "/css/global.js"),
		
		{
			input: "src/platforms/electron/mainProcess/bootstrap.ts",
			
			plugins: [
				commonjs({
					requireReturnsDefault: "preferred",
					ignore: nodeIgnore,
				}),
			],
			
			output: {
				sourcemap: true,
				file: dir + "/mainProcess/bootstrap.js",
			},
		},
		
		{
			input: "src/platforms/electron/mainProcess/main.ts",
			
			plugins: [
				commonjs({
					requireReturnsDefault: "preferred",
					ignore: nodeIgnore,
				}),
			],
			
			output: {
				sourcemap: true,
				format: "cjs",
				file: dir + "/mainProcess/main.js",
			},
		},
		
		{
			input: "src/platforms/electron/main.ts",
			
			output: {
				sourcemap: true,
				file: dir + "/js/main.js",
				format: "iife",
			},
			
			plugins: [
				...electronPlugins(),
				
				copy({
					watch: watch && [
						"src/platforms/electron/public",
						"vendor/public",
					],
					
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
		},
	);
}

if (platform === "all" || platform === "web") {
	let dir = "build/" + (dev ? "web-dev" : "web");
	
	addBuilds(globalCssBuild(dir + "/css/global.js"), {
		input: "src/platforms/web/main.ts",
		
		output: {
			sourcemap: dev,
			file: dir + "/js/main.js",
		},
		
		plugins: [
			...webPlugins(),
			
			copy({
				watch: watch && ["src/platforms/web/public", "vendor/public"],
				
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
			
			watch && livereload(dir),
			prod && terser(),
			dev && markBuildComplete(dir),
		],
	});
}

if (platform === "all" || platform === "test") {
	let dir = "build/test";
	
	addBuilds({
		input: "test/main.ts",
		
		output: {
			file: dir + "/js/main.js",
		},
		
		plugins: [
			...webPlugins(),
			
			copy({
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
			}),
		],
	}, {
		input: "test/tests/**/*.test.ts",
		
		output: {
			sourcemap: true,
			file: dir + "/js/tests.js",
		},
		
		plugins: [
			multi(),
			...webPlugins(),
			markBuildComplete(dir),
		],
	});
}

export default builds;
