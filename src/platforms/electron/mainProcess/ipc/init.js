let os = require("os");

module.exports = function(app) {
	return {
		init(e) {
			let {config} = app;
			
			let isMainWindow = (
				app.browserWindows.length === 1
				&& app.browserWindows[0] === app.browserWindowFromEvent(e)
			);
			
			return {
				config,
				
				isMainWindow,
				
				systemInfo:{
					newline: os.EOL,
				},
			};
		},
	};
}
