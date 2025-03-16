import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import typescript from "@rollup/plugin-typescript";
import alias from "@rollup/plugin-alias";
import scss from "rollup-plugin-scss";
import preprocess from "svelte-preprocess";
import multi from "@rollup/plugin-multi-entry";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy-watch";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import externals from "rollup-plugin-node-externals";
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

let common = {
	alias() {
		// SYNC keep these in sync with tsconfig.json
		return alias({
			entries: {
				"root": root,
				"components": path.join(root, "src/components"),
				"modules": path.join(root, "src/modules"),
				"utils": path.join(root, "src/utils"),
				"platforms": path.join(root, "src/platforms"),
				"vendor": path.join(root, "vendor"),
				"test": path.join(root, "test"),
			},
		});
	},
	
	resolve(opts={}) {
		return resolve({
			extensions: [".js", ".ts", ".svelte"],
			...opts,
		});
	},
	
	typescript(opts={}) {
		return typescript({
			compilerOptions: {
				// going by https://www.typescriptlang.org/tsconfig/#module
				// which says we probably want esnext for bundled code
				// this affects the kind of import/export statements that
				// are emitted
				module: "esnext",
				...opts,
			},
		});
	},
	
	// NOTE this might only be needed in main process and preload builds
	externals() {
		return externals({
			// it can add/strip the node: prefix -- don't want to mess with them
			builtinsPrefix: "ignore",
			
			// defaults to making all non-dev deps external
			deps: false,
			peerDeps: false,
			optDeps: false,
			
			include: [
				"os",
				"child_process",
				"fs",
				"path",
				"constants",
				"util",
				"stream",
				"assert",
				"string_decoder",
				"buffer",
				"events",
				
				// NOTE not sure if these need repeating, maybe that's
				// what the strip/add default is for... in any case
				// probs best to just always use them in our code and
				// keep the auto add/strip off
				"node:os",
				"node:child_process",
				"node:fs",
				"node:path",
				"node:constants",
				"node:util",
				"node:stream",
				"node:assert",
				"node:string_decoder",
				"node:buffer",
				"node:events",
				
				"glob",
				"fs-extra",
				"electron",
				"chokidar",
				"yargs",
			],
		});
	},
};

function commonPlugins(platform) {
	let dir = "build/" + (dev ? platform + "-dev" : platform);
	
	return [
		common.alias(),
		
		common.externals(),
		
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
		
		common.resolve({
			browser: true,
			dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
		}),
		
		common.typescript(),
		
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

/*
TODO do we need to add node: to these?

(are they even needed anymore? -- probably not, if we're using
esm imports -- yeah, definitely not.)
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

function mainProcessPlugins() {
	return [
		common.alias(),
		
		common.externals(),
		
		common.resolve(),
		
		commonjs({
			requireReturnsDefault: "preferred",
			//ignore: nodeIgnore,
		}),
		
		common.typescript(),
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
		input: "src/css/globalCss.js",
		
		output: {
			file: path,
		},
		
		plugins: [
			scss(),
			
			cssOnly({
				output: "global.css",
			}),
			
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
			plugins: mainProcessPlugins(),
			
			output: {
				sourcemap: true,
				file: dir + "/mainProcess/bootstrap.js",
			},
		},
		
		{
			input: "src/platforms/electron/mainProcess/main.ts",
			plugins: mainProcessPlugins(),
			
			output: {
				sourcemap: true,
				file: dir + "/mainProcess/main.js",
			},
		},
		
		{
			input: "src/platforms/electron/main.ts",
			
			output: {
				sourcemap: true,
				file: dir + "/js/main.js",
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
				
				dev && markBuildComplete(dir),
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
