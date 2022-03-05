import App from "modules/App";
import AppComponent from "components/App/App.svelte";
import init from "./init";

// ENTRYPOINT main (renderer) process for Electron

init(async function() {
	let app = new App();
	
	await app.init();
	
	new AppComponent({
		target: document.body,
		
		props: {
			app,
		},
	});
	
	// DEV:
	
	window.app = app;
});
