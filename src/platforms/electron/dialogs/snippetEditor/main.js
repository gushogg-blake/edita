import init from "../../init";
import query from "../../modules/query";
import App from "./modules/App";
import AppComponent from "./components/App.svelte";

init(async function() {
	let app = new App(query());
	
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