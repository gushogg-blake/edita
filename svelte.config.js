import preprocess from "svelte-preprocess";

import {spawn} from "node:child_process";

function printr(data) {
	let curl = spawn("curl", [
		"-H", "Content-Type: application/json",
		"--data-binary", "@-",
		"https://printr.gushogg-blake.com/print/5f269e29-9584-4d4e-b5c4-549a046413c3",
	], {
		stdio: ["pipe", "inherit", "inherit"],
	});
	
	curl.stdin.write(JSON.stringify(data));
	curl.stdin.end();
}

export default {
	preprocess: preprocess({
		scss: {
			// NOTE this doesn't seem to be present in the type for options
			// see https://www.npmjs.com/package/sass?activeTab=code, types/options
			// looks like maybe loadPaths is the new name for it
			includePaths: ["src/css"],
		},
	}),
	
	compilerOptions: {
		warningFilter(warning) {
			if (warning.filename?.includes("node_modules")) return false;
			if (warning.code.startsWith("a11y")) return false;
			if (warning.code === "css_unused_selector") return false;
			if (warning.code === "state_referenced_locally") return false;
			
			return true;
		},
	},
};
