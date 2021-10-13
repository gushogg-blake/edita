import getDialogOptions from "platform/modules/getDialogOptions";
import App from "./App";
import AppComponent from "./App.svelte";

(async function() {
	let app = new App(getDialogOptions());
	
	await app.init();
	
	new AppComponent({
		target: document.body,
		
		props: {
			app,
		},
	});
	
	// DEV:
	
	window.app = app;
})();
