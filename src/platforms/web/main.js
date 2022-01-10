import Base from "modules/Base";
import App from "modules/App";
import components from "components";
import AppComponent from "components/App/App.svelte";
import Editor from "components/Editor/Editor.svelte";
import Platform from "./Platform";

window.platform = new Platform();
window.base = new Base();

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
		async app(el) {
			let app = new App();
			
			await app.init();
			
			new AppComponent({
				target: el,
				
				props: {
					app,
				},
			});
			
			return app;
		},
		
		Editor,
	};
}
