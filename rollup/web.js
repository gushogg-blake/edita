import scss from "rollup-plugin-scss";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy-watch";
import terser from "@rollup/plugin-terser";
import html from "@rollup/plugin-html";

import {dev, prod, watch} from "./env.js";
import {markBuildComplete} from "./utils.js";
import {baseConfig, basePlugins} from "./base.js";
import platformCommonPlugins, {copyTreeSitterWasm, copyPackageJson} from "./platformCommonPlugins.js";

let dir = "build/" + (dev ? "web-dev" : "web");

export default [
	{
		...baseConfig,
		
		input: "src/platforms/web/main.ts",
		
		output: {
			sourcemap: dev,
			file: dir + "/js/main.js",
		},
		
		plugins: [
			...platformCommonPlugins("web"),
			watch && livereload(dir),
			prod && copyPackageJson(dir),
			copyTreeSitterWasm(dir),
			copyVendorPublic(),
			prod && terser(),
			_html(),
			dev && markBuildComplete(dir),
		],
	},
];

function _html() {
	return html({
		title: "Edita",
		addScriptsToHead: true,
	});
}

function copyVendorPublic() {
	return copy({
		watch: watch && "vendor/public",
		
		targets: [
			{
				src: "vendor/public/*",
				dest: dir + "/vendor",
			},
		],
	});
}
