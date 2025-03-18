import {mount, unmount} from "svelte";
import {promiseWithMethods} from "utils";
import dialogs from "modules/ui/dialogs";
import components from "components";
import DialogWindow from "./DialogWindow";

export default function(app) {
	return async function(dialogName, dialogOptions, windowOptions) {
		let promise = promiseWithMethods();
		let response = undefined;
		
		let AppClass = dialogs[dialogName];
		let AppComponent = components.dialogs[dialogName];
		
		let dialogWindow = new DialogWindow(app, windowOptions);
		
		let app = new AppClass({
			close() {
				dialogWindow.close();
			},
			
			respond(value) {
				response = value;
			},
		}, dialogOptions);
		
		await app.init();
		
		let appComponent = mount(AppComponent, {
			target: dialogWindow.content,
			
			props: {
				app,
			},
		});
		
		dialogWindow.on("close", () => {
			app.teardown();
			
			unmount(appComponent);
			
			promise.resolve(response);
		});
		
		return promise;
	}	
}
