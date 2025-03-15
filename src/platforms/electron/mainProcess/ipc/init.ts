export default function(app) {
	return {
		init(e) {
			let window = app.browserWindowFromEvent(e);
			let config = app.getPerWindowConfig(window);
			
			return {
				config,
				isMainWindow: window === app.mainWindow,
			};
		},
	};
}
