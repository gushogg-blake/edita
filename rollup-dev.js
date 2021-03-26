import * as child_process from "child_process";

let running = false;

export default {
	writeBundle() {
		if (!running) {
			child_process.spawn("npm", ["run", "start:dev"], {
				stdio: ["ignore", "inherit", "inherit"],
				shell: true,
			});
			
			running = true;
		}
	},
};
