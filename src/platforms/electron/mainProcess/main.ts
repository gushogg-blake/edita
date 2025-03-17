import {app as electronApp} from "electron";
import {spawn} from "node:child_process";
import path from "node:path";
import App from "./App";
import config from "./config";
import watch from "./watch";

// ENTRYPOINT main (node) process for electron

electronApp.setPath("userData", path.join(config.userDataDir, "electron"));

(async function() {
	let app = new App();
	
	await app.launch();
	
	if (config.dev) {
		watch(app);
	}
})();
