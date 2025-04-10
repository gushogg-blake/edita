import App from "electronMain/App";

export default function(app: App) {
	return {
		open(e, name, dialogOptions) {
			return app.openDialogWindow(name, dialogOptions, app.browserWindowFromEvent(e));
		},
	};
}
