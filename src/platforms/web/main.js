import Base from "modules/Base";
import App from "modules/App";
import AppComponent from "components/App/App.svelte";
import Platform from "./Platform";

window.platform = new Platform();
window.base = new Base();

export default async function(options) {
	await platform.init(options);
	await base.init();
	
	return function(el) {
		let app = new App();
		
		new AppComponent({
			target: el,
			
			props: {
				app,
			},
		});
		
		return app;
	}
}
