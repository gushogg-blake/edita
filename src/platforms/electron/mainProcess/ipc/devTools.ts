export default function(app) {
	return {
		open(e) {
			app.browserWindowFromEvent(e).webContents.openDevTools();
		},
	};
}
