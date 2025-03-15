import Base from "modules/Base";
import App from "modules/App";
import components from "components";
import AppComponent from "components/App/App.svelte";
import Textarea from "platforms/web/components/Textarea.svelte";
import Platform from "./Platform";

window.platform = new Platform();
window.base = new Base();

// ENTRYPOINT main function for web - perform init tasks and return an object
// with a function to create a whole app, and the Editor component.
// (the returned functions can be called more than once to create multiple
// instances on the same page)

export default async function(options) {
	let {
		config,
		prefs,
		init,
	} = options;
	
	await platform.init(config);
	
	await base.init(components, {
		prefs,
		init,
	});
	
	return {
		// ENTRYPOINT create an app and UI instance
		
		async app(el) {
			let app = new App();
			
			await app.init();
			
			let appComponent = new AppComponent({
				target: el,
				
				props: {
					app,
				},
			});
			
			return {
				app,
				appComponent,
			};
		},
		
		Textarea,
	};
}
