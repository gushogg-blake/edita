import {spawnSync} from "node:child_process";

/*
mark builds as complete for ./scripts/await-build
*/

export function markBuildComplete(dir) {
	return {
		name: "internal-mark-build-complete",
		
		generateBundle() {
			spawnSync("touch", [dir + "/.build-complete"], {
				stdio: "inherit",
				shell: true,
			});
		},
	};
}
