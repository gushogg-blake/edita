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
			};
		},
	};
}
