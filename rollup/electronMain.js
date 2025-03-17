import {dev} from "./env.js";
import {watchOptions} from "./utils.js";
import base from "./base.js";
import commonPlugins from "./commonPlugins.js";

let dir = "build/" + (dev ? "electron-dev" : "electron");

function mainProcessPlugins() {
	return [
		...commonPlugins,
		base.externals(),
		base.resolve(),
		base.commonjs(),
		base.typescript(),
	];
}

export default [
	// bootstrap
	{
		input: "src/platforms/electron/mainProcess/bootstrap.ts",
		plugins: mainProcessPlugins(),
		watch: watchOptions(),
		
		output: {
			sourcemap: true,
			file: dir + "/mainProcess/bootstrap.js",
		},
	},
	
	// electron main
	{
		input: "src/platforms/electron/mainProcess/main.ts",
		plugins: mainProcessPlugins(),
		watch: watchOptions(),
		
		output: {
			sourcemap: true,
			file: dir + "/mainProcess/main.js",
		},
	},
];
