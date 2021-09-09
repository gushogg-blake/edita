import init from "../../init";
import App from "./modules/App";
import AppComponent from "./components/App.svelte";

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
