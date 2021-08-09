import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import svelte from "rollup-plugin-svelte";
import cssOnly from "rollup-plugin-css-only";
import {terser} from "rollup-plugin-terser";
import preprocess from "svelte-preprocess";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import scss from "rollup-plugin-scss";

let production = !process.env.ROLLUP_WATCH;

let platforms = [];
let platform = process.env.PLATFORM;

if (!platform || platform === "all" || platform === "electron") {
	platforms.push({
		input: "src/platforms/common/globalCss.js",
		
		output: {
			format: "iife",
			file: "src/platforms/electron/renderer/public/build/globalCss.js",
		},
		
		plugins: [
			scss(),
		],
	},
	{
		input: "src/platforms/common/globalCss.js",
		
		output: {
			format: "iife",
			file: "src/platforms/web/public/build/globalCss.js",
		},
		
		plugins: [
			scss(),
		],
	},
	{
		input: "src/platforms/electron/renderer/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: "src/platforms/electron/renderer/public/build/bundle.js",
		},
		
		plugins: [
			svelte({
				preprocess: preprocess({
					scss: {
						includePaths: ["src/css"],
					},
				}),
				
				compilerOptions: {
					// enable run-time checks when not in production
					dev: !production,
				},
			}),
			
			cssOnly({
				output: "bundle.css",
			}),
	
			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration -
			// consult the documentation for details:
			// https://github.com/rollup/rollup-plugin-commonjs
			resolve({
				browser: true,
				dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
			}),
			
			commonjs({
				ignore: [
					"os",
					"fs",
					"path",
					"constants",
					"util",
					"stream",
					"assert",
					"string_decoder",
					"buffer",
					"events",
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
		input: "src/platforms/web/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			name: "editor",
			file: "src/platforms/web/public/build/bundle.js",
		},
		
		plugins: [
			svelte({
				preprocess: preprocess({
					scss: {
						includePaths: ["src/css"],
					},
				}),
				
				compilerOptions: {
					// enable run-time checks when not in production
					dev: !production,
				},
			}),
			
			cssOnly({
				output: "bundle.css",
			}),
	
			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration -
			// consult the documentation for details:
			// https://github.com/rollup/rollup-plugin-commonjs
			resolve({
				browser: true,
				dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
			}),
			
			commonjs({
				ignore: [
					"os",
					"fs",
					"path",
					"constants",
					"util",
					"stream",
					"assert",
					"string_decoder",
					"buffer",
					"events",
				],
			}),
			
			globals(),
			builtins(),
			!production && livereload("src/platforms/web/public/build"),
			production && terser(),
		],
	});
}

export default platforms;
