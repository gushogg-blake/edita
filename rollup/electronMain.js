import {dev, prod, watch} from "./env.js";

/*
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
import html from "@rollup/plugin-html";
*/

let dir = "build/" + (dev ? "electron-dev" : "electron");
	
export default [
	// bootstrap
	
	{
		input: "src/platforms/electron/mainProcess/bootstrap.ts",
		plugins: mainProcessPlugins(),
		
		output: {
			sourcemap: true,
			file: dir + "/mainProcess/bootstrap.js",
		},
	},
	
	// electron main
	
	{
		input: "src/platforms/electron/mainProcess/main.ts",
		plugins: mainProcessPlugins(),
		
		output: {
			sourcemap: true,
			file: dir + "/mainProcess/main.js",
		},
	},
];

