import preprocess from "svelte-preprocess";
import copy from "rollup-plugin-copy-watch";
import terser from "@rollup/plugin-terser";
import html from "@rollup/plugin-html";

import {dev, prod, watch} from "./env.js";
import {markBuildComplete} from "./utils.js";
import {baseConfig, basePlugins} from "./base.js";
import platformCommonPlugins, {copyTreeSitterWasm, copyPackageJson} from "./platformCommonPlugins.js";

let dir = "build/" + (dev ? "electron-dev" : "electron");
	
export default [
	{
		...baseConfig,
		
		input: "src/platforms/electron/main.ts",
		
		output: {
			sourcemap: true,
			file: dir + "/main.js",
		},
		
		plugins: [
			...platformCommonPlugins("electron"),
			prod && copyPackageJson(dir),
			copyTreeSitterWasm(dir),
			copyVendorPublic(),
			_html(),
			dev && markBuildComplete(dir),
		],
	},
];

function _html() {
	return html({
		title: "Edita",
		publicPath: "/",
		addScriptsToHead: true,
	});
}

function copyVendorPublic() {
	return copy({
		watch: watch && [
			"vendor/public",
		],
		
		targets: [
			{
				src: "vendor/public/*",
				dest: dir + "/vendor",
			},
		],
	});
}
