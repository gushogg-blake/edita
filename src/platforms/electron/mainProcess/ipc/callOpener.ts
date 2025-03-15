export default function(app) {
	return {
		call(e, channel, ...args) {
			return app.callRenderer(app.dialogOpeners.get(app.browserWindowFromEvent(e)), channel, ...args);
		},
	};
}
