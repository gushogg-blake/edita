import commonjs from "@rollup/plugin-commonjs";
import webCommonPlugins from "./webCommonPlugins.js";

/*
plugins common to web and test
*/

export default function() {
	return [
		...webCommonPlugins("web"),
		
		commonjs({
			requireReturnsDefault: "preferred",
		}),
	];
}
