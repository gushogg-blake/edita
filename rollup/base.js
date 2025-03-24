import path from "node:path";

import typescript from "@rollup/plugin-typescript";
import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import externals from "rollup-plugin-node-externals";
import json from "@rollup/plugin-json";

import {root} from "./env.js";

function watchOptions() {
	return {
		clearScreen: false,
		buildDelay: 100,
		
		chokidar: {
			usePolling: true,
		},
	};
}

export let baseConfig = {
	watch: watchOptions(),
	
	onwarn() {},
};

// SYNC tsconfig, rollup aliases
let aliasEntries = {
	"root": root,
	"platforms": path.join(root, "src/platforms"),
	"electronMain": path.join(root, "src/platforms/electron/mainProcess"),
	"base": path.join(root, "src/base"),
	"core": path.join(root, "src/core"),
	"components": path.join(root, "src/components"),
	"modules": path.join(root, "src/modules"),
	"ui": path.join(root, "src/ui"),
	"utils": path.join(root, "src/utils"),
	"css": path.join(root, "src/css"),
	"vendor": path.join(root, "vendor"),
	"test": path.join(root, "test"),
};

/*
externals - needed for both main and renderer, to avoid bundling node
builtins.

included in the web build for config simplicity, even though it won't
be needed.

NOTE not sure if commonjs needs the ignore list now that externals is
doing it
*/

let nodeIgnore = [
	"glob",
	"fs-extra",
	"electron",
	"electron-window-state",
	"chokidar",
	"yargs",
];

let commonjsIgnore = [
	...nodeIgnore,
	"node:*",
];

let externalsIgnore = [
	...nodeIgnore,
	/^node:/,
];

export let basePlugins = {
	alias() {
		return alias({
			entries: aliasEntries,
		});
	},
	
	json() {
		return json();
	},
	
	resolve() {
		return resolve();
	},
	
	resolveBrowser() {
		return resolve({
			extensions: [".js", ".ts", ".svelte"],
			browser: true,
			dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
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
	
	externals() {
		return externals({
			// it can add/strip the node: prefix -- don't want to mess with them
			builtinsPrefix: "ignore",
			
			// defaults to making all non-dev deps external
			deps: false,
			peerDeps: false,
			optDeps: false,
			
			include: externalsIgnore,
		});
	},
	
	commonjs() {
		return commonjs({
			requireReturnsDefault: "preferred",
			ignore: commonjsIgnore,
		});
	},
};
