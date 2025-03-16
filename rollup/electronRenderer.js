import preprocess from "svelte-preprocess";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy-watch";
import terser from "@rollup/plugin-terser";
import html from "@rollup/plugin-html";

import {dev, prod, watch} from "./env.js";
import {markBuildComplete, watchOptions} from "./utils.js";
import platformCommonPlugins, {copyTreeSitterWasm, copyPackageJson} from "./platformCommonPlugins.js";

let dir = "build/" + (dev ? "electron-dev" : "electron");
	
export default [
	{
		input: "src/platforms/electron/main.ts",
		
		output: {
			sourcemap: true,
			file: dir + "/main.js",
		},
		
		watch: watchOptions(),
		
		plugins: [
			...platformCommonPlugins("electron"),
			prod && copyPackageJson(dir),
			copyTreeSitterWasm(dir),
			copyVendorPublic(),
			html(),
			dev && markBuildComplete(dir),
		],
	},
];

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
