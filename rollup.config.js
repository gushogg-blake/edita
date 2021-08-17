import path from "path";

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import livereload from "rollup-plugin-livereload";
import svelte from "rollup-plugin-svelte";
import cssOnly from "rollup-plugin-css-only";
import {terser} from "rollup-plugin-terser";
import preprocess from "svelte-preprocess";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import scss from "rollup-plugin-scss";

let production = !process.env.ROLLUP_WATCH;

let root = __dirname;

let platforms = [];
let platform = process.env.PLATFORM;

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
			file: "src/platforms/electron/public/build/bundle.js",
		},
		
		plugins: [
			alias({
				entries: {
					"platform": path.resolve(root, "src/platforms/electron"),
					"components": path.resolve(root, "src/components"),
					"modules": path.resolve(root, "src/modules"),
					"utils": path.resolve(root, "src/utils"),
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
				output: "bundle.css",
			}),
	
			resolve({
				browser: true,
				dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
			}),
			
			commonjs({
				ignore: [
					"os",
					"fs",
					"fs-extra",
					"path",
					"constants",
					"util",
					"stream",
					"assert",
					"string_decoder",
					"buffer",
					"events",
					"electron",
					"electron-better-ipc",
				],
			}),
			
			globals(),
			builtins(),
			production && terser(),
		],
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
			file: "src/platforms/web/public/build/bundle.js",
		},
		
		plugins: [
			alias({
				entries: {
					"platform": path.resolve(root, "src/platforms/web"),
					"components": path.resolve(root, "src/components"),
					"modules": path.resolve(root, "src/modules"),
					"utils": path.resolve(root, "src/utils"),
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
				output: "bundle.css",
			}),
			
			resolve({
				browser: true,
				dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
			}),
			
			commonjs(),
			!production && livereload("src/platforms/web/public/build"),
			production && terser(),
		],
	});
}

export default platforms;
