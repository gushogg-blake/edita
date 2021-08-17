let {app: electronApp} = require("electron");
let dev = require("electron-is-dev");
let path = require("path");
let App = require("./App");
let config = require("./config");

electronApp.setPath("userData", path.join(config.userDataDir, "electron"));

(async function() {
	let app = new App();
	
	await app.launch();
	
	if (dev) {
		require("./watch")(app);
	}
})();
