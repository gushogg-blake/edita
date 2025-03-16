import {app as electronApp} from "electron";
import {spawn} from "node:child_process";
import path from "path";
import App from "./App";
import config from "./config";
import watch from "./watch";

// ENTRYPOINT main (node) process for electron

electronApp.setPath("userData", path.join(config.userDataDir, "electron"));

let {debugEndpoint} = config;

if (debugEndpoint) {
	function printr(data, stack) {
		let curl = spawn("curl", [
			"-H", "Content-Type: application/json",
			"--data-binary", "@-",
			debugEndpoint,
		], {
			stdio: ["pipe", "ignore", "ignore"],
		});
		
		curl.stdin.write(JSON.stringify({
			stack,
			data,
		}));
		
		curl.stdin.end();
	}
	
	let oldOut = process.stdout.write;
	let oldErr = process.stderr.write;
	
	process.stdout.write = function(str, enc, fd) {
		let e = {};
		
		Error.captureStackTrace(e, process.stdout.write);
		
		printr(str, e.stack);
		
		oldOut.call(process.stdout, str, enc, fd);
	}
	
	process.stderr.write = function(str, enc, fd) {
		let e = {};
		
		Error.captureStackTrace(e, process.stderr.write);
		
		printr(str, e.stack);
		
		oldErr.call(process.stderr, str, enc, fd);
	}
}

(async function() {
	let app = new App();
	
	await app.launch();
	
	if (config.dev) {
		watch(app);
	}
})();
