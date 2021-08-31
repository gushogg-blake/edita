let {app: electronApp} = require("electron");
let path = require("path");
let App = require("./App");
let config = require("./config");

electronApp.setPath("userData", path.join(config.userDataDir, "electron"));

(async function() {
	let app = new App();
	
	await app.launch();
	
	if (config.dev) {
		require("./watch")(app);
	}
})();
