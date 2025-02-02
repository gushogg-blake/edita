let {app: electronApp} = require("electron");
let path = require("path");
let App = require("./App");
let config = require("./config");

// ENTRYPOINT main (node) process for electron

electronApp.setPath("userData", path.join(config.userDataDir, "electron"));

let {debugEndpoint} = config;

if (debugEndpoint) {
	function printr(data) {
		let curl = require("child_process").spawn("curl", [
			"-H", "Content-Type: application/json",
			"--data-binary", "@-",
			debugEndpoint,
		], {
			stdio: ["pipe", "ignore", "ignore"],
		});
		
		curl.stdin.write(JSON.stringify(data));
		curl.stdin.end();
	}
	
	let oldOut = process.stdout.write;
	let oldErr = process.stderr.write;
	
	process.stdout.write = function(str, enc, fd) {
		printr(str);
		
		oldOut.call(process.stdout, str, enc, fd);
	}
	
	process.stderr.write = function(str, enc, fd) {
		printr(str);
		
		oldErr.call(process.stderr, str, enc, fd);
	}
}

(async function() {
	let app = new App();
	
	await app.launch();
	
	if (config.dev) {
		require("./watch")(app);
	}
})();
