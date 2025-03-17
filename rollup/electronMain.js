import {dev} from "./env.js";
import {basePlugins, baseConfig} from "./base.js";
import commonPlugins from "./commonPlugins.js";

let dir = "build/" + (dev ? "electron-dev" : "electron");

function mainProcessPlugins() {
	return [
		...commonPlugins,
		basePlugins.externals(),
		basePlugins.resolve(),
		basePlugins.commonjs(),
		basePlugins.typescript(),
	];
}

export default [
	// bootstrap
	{
		...baseConfig,
		
		input: "src/platforms/electron/mainProcess/bootstrap.ts",
		
		plugins: mainProcessPlugins(),
		
		output: {
			sourcemap: true,
			file: dir + "/mainProcess/bootstrap.js",
		},
	},
	
	// electron main
	{
		...baseConfig,
		
		input: "src/platforms/electron/mainProcess/main.ts",
		
		plugins: mainProcessPlugins(),
		
		output: {
			sourcemap: true,
			file: dir + "/mainProcess/main.js",
		},
	},
];
