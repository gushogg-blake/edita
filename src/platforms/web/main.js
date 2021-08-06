import AppComponent from "../../components/App/App.svelte";
import Platform from "./Platform";
import Base from "./Base";
import App from "./App";

window.platform = new Platform();
window.base = new Base();

let initialised = false;

export default async function(el) {
	if (!initialised) {
		await base.init();
		
		initialised = true;
	}
	
	let app = new App();
	
	new AppComponent({
		target: el,
		
		props: {
			app,
		},
	});
	
	return app;
}
