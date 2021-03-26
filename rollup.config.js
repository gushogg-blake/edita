import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import {terser} from "rollup-plugin-terser";
import rollupDev from "./rollup-dev";
import autoPreprocess from "svelte-preprocess";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";

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
			// enable run-time checks when not in production
			dev: !production,
			
			// we'll extract any component CSS out into
			// a separate file — better for performance
			preprocess: autoPreprocess({
				scss: {
					includePaths: ["src"],
				},
				
				postcss: {
					plugins: [require("autoprefixer")],
				},
			}),
			
			css: css => {
				css.write("public/bundle.css");
			},
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration —
		// consult the documentation for details:
		// https://github.com/rollup/rollup-plugin-commonjs
		resolve({
			browser: true,
			dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
		}),
		
		commonjs(),
		globals(),
		builtins(),

		// In dev mode, call `npm run start:dev` once
		// the bundle has been generated
		!production && rollupDev,

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload("public"),
		
		production && terser(),
	],
	
	watch: {
		clearScreen: false,
	},
};
