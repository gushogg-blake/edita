import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import cssOnly from "rollup-plugin-css-only";
import {terser} from "rollup-plugin-terser";
import preprocess from "svelte-preprocess";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";

let production = !process.env.ROLLUP_WATCH;

export default [
	{
		input: "src/platforms/electron/renderer/main.js",
		
		output: {
			sourcemap: true,
			format: "iife",
			file: "build/electron/bundle.js",
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
	},
];
