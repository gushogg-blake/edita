import Base from "modules/Base";
import App from "modules/App";
import components from "components";
import AppComponent from "components/App/App.svelte";
import Platform from "./Platform";

window.platform = new Platform();
window.base = new Base();

export default async function(options) {
	await platform.init(options);
	await base.init(components);
	
	return async function(el) {
		let app = new App();
		
		await app.init();
		
		new AppComponent({
			target: el,
			
			props: {
				app,
			},
		});
		
		return app;
	}
}
