let os = require("os");
let path = require("path");

module.exports = function(app) {
	return {
		init(e) {
			let {
				config,
				filesToOpenOnStartup,
			} = app;
			
			return {
				config,
				isMainWindow: app.browserWindowFromEvent(e) === app.mainWindow,
				filesToOpenOnStartup,
				
				systemInfo: {
					newline: os.EOL,
					homeDir: os.homedir(),
					pathSeparator: path.sep,
					multiPathSeparator: process.platform === "win32" ? ";" : ":",
				},
			};
		},
	};
}
