let os = require("os");

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
				},
			};
		},
	};
}
