import {dev, prod, watch} from "./env.js";
import {markBuildComplete, watchOptions} from "./utils.js";
import platformCommonPlugins from "./platformCommonPlugins.js";

let dir = "build/" + (dev ? "electron-dev" : "electron");
	
export default [
	{
		input: "src/platforms/electron/main.ts",
		
		output: {
			sourcemap: true,
			file: dir + "/js/main.js",
		},
		
		watchOptions(),
		
		plugins: [
			...platformCommonPlugins("electron"),
			
			commonjs({
				requireReturnsDefault: "preferred",
				ignore: commonjsIgnore,
			}),
			
			copy({
				watch: watch && [
					"vendor/public",
				],
				
				targets: [
					{
						src: "vendor/public/*",
						dest: dir + "/vendor",
					},
				],
			}),
			
			dev && markBuildComplete(dir),
		],
	},
];
