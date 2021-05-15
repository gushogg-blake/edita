import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import cssOnly from "rollup-plugin-css-only";
import livereload from "rollup-plugin-livereload";
import {terser} from "rollup-plugin-terser";
import preprocess from "svelte-preprocess";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import rollupDev from "./rollup-dev";

let production = !process.env.ROLLUP_WATCH;

export default {
	input: "src/app.js",
	
	output: {
		sourcemap: true,
		format: "iife",
		name: "app",
		file: "public/bundle.js",
	},
	
	plugins: [
		svelte({
			// we'll extract any component CSS out into
			// a separate file - better for performance
			preprocess: preprocess({
				scss: {
					includePaths: ["src"],
				},
				
				postcss: {
					plugins: [require("autoprefixer")],
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

		// In dev mode, call npm run start:dev once
		// the bundle has been generated
		!production && rollupDev,

		// Watch the public directory and refresh the
		// browser on changes when not in production
		!production && livereload("public"),
		
		production && terser(),
	],
	
	watch: {
		clearScreen: false,
	},
};
