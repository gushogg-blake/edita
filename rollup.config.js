import path from "path";

import scss from "@gushogg-blake/rollup-plugin-scss";
import preprocess from "@gushogg-blake/svelte-preprocess";
import multi from "@rollup/plugin-multi-entry";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy-watch";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import svelte from "rollup-plugin-svelte";
import cssOnly from "rollup-plugin-css-only";
import _delete from "rollup-plugin-delete";

let dev = process.env.NODE_ENV === "development";
let prod = !dev;
let watch = process.env.ROLLUP_WATCH;
let root = __dirname;
let platform = process.env.PLATFORM || "all";

/*
mark builds as complete for ./scripts/await-build
*/

function markBuildComplete(dir) {
	return {
		name: "internal-mark-build-complete",
		
		generateBundle() {
			require("child_process").spawnSync("touch", [dir + "/.build-complete"], {
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
	return [
		alias({
			entries: {
				"root": root,
				"components": path.join(root, "src/components"),
				"modules": path.join(root, "src/modules"),
				"utils": path.join(root, "src/utils"),
				"platforms": path.join(root, "src/platforms"),
				"platform": path.join(root, "src/platforms/" + platform),
				"common": path.join(root, "common"),
				"vendor": path.join(root, "vendor"),
				"test": path.join(root, "test"),
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
		
		copy({
			watch: watch && "package.json",
			
			targets: [
				{
					src: "package.json",
					dest: "build/" + platform,
				},
			],
		}),
		
		json(),
	];
}

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

if (platform === "all" || platform === "electron") {
	let dir = "build/" + (dev ? "electron-dev" : "electron");
	
	addBuilds(
		globalCssBuild(dir + "/css/global.js"),
		
		{
			input: "src/platforms/electron/mainProcess/bootstrap.js",
			
			plugins: [
				commonjs({
					requireReturnsDefault: "preferred",
					ignore: nodeIgnore,
				}),
			],
			
			output: {
				sourcemap: true,
				format: "cjs",
				file: dir + "/mainProcess/bootstrap.js",
			},
		},
		
		{
			input: "src/platforms/electron/mainProcess/main.js",
			
			plugins: [
				alias({
					entries: {
						"_common": path.join(root, "common"),
						"vendor": path.join(root, "vendor"),
					},
				}),
				
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
			input: "src/platforms/electron/main.js",
			
			output: {
				sourcemap: true,
				format: "iife",
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
			],
		},
		
		{
			input: "src/platforms/electron/dialogs/fileChooser/main.js",
			
			output: {
				sourcemap: true,
				format: "iife",
				file: dir + "/js/dialogs/fileChooser/main.js",
			},
			
			plugins: [
				...electronPlugins(),
				//watch && livereload(dir), // doesn't work for some reason
			],
		},
		
		{
			input: "src/platforms/electron/dialogs/messageBox/main.js",
			
			output: {
				sourcemap: true,
				format: "iife",
				file: dir + "/js/dialogs/messageBox/main.js",
			},
			
			plugins: [
				...electronPlugins(),
				//watch && livereload(dir), // doesn't work for some reason
			],
		},
		
		{
			input: "src/platforms/electron/dialogs/snippetEditor/main.js",
			
			output: {
				sourcemap: true,
				format: "iife",
				file: dir + "/js/dialogs/snippetEditor/main.js",
			},
			
			plugins: [
				...electronPlugins(),
				//watch && livereload(dir), // doesn't work for some reason
				dev && markBuildComplete(dir),
			],
		},
	);
}

if (platform === "all" || platform === "web") {
	let dir = "build/" + (dev ? "web-dev" : "web");
	
	addBuilds(globalCssBuild(dir + "/css/global.js"), {
		input: "src/platforms/web/main.js",
		
		output: {
			sourcemap: dev,
			format: "iife",
			name: "Edita",
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
		input: "test/main.js",
		
		output: {
			format: "iife",
			file: dir + "/js/main.js",
			name: "main",
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
		input: "test/tests/**/*.test.js",
		
		output: {
			sourcemap: true,
			format: "iife",
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
