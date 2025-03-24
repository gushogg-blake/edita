import {mount, unmount} from "svelte";
import {promiseWithMethods} from "utils";
import dialogs from "ui/dialogs";
import components from "components";
import DialogWindow from "./DialogWindow";

export default async function(dialogName, dialogOptions, windowOptions, renderDiv) {
	let promise = promiseWithMethods();
	let response = undefined;
	
	let AppClass = dialogs[dialogName];
	let AppComponent = components.dialogs[dialogName];
	
	let dialogWindow = new DialogWindow(windowOptions, renderDiv);
	
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
		
		app.focusSelectedTabAsync();
	});
	
	return promise;
}
