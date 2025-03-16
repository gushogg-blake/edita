import {dev, prod, watch} from "./env.js";
import {markBuildComplete} from "./utils.js";
import webCommonPlugins from "./webCommonPlugins.js";

let dir = "build/" + (dev ? "web-dev" : "web");
	
export default [
	{
		input: "src/platforms/web/main.ts",
		
		output: {
			sourcemap: dev,
			file: dir + "/js/main.js",
		},
		
		plugins: [
			...webCommonPlugins(),
			
			copy({
				watch: watch && ["src/platforms/web/public", "vendor/public"],
				
				targets: [
					{
						src: "src/platforms/web/public/*",
						dest: dir,
					},
					{
						src: "vendor/public/*",
						dest: dir + "/vendor",
					},
				],
			}),
			
			watch && livereload(dir),
			prod && terser(),
			html(),
			dev && markBuildComplete(dir),
		],
	},
];
