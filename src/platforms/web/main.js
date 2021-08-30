import Base from "modules/Base";
import App from "modules/App";
import components from "components";
import Platform from "./Platform";

window.platform = new Platform();
window.base = new Base(components);

export default async function(options) {
	await platform.init(options);
	await base.init();
	
	return function(el) {
		let app = new App();
		
		new components.App({
			target: el,
			
			props: {
				app,
			},
		});
		
		return app;
	}
}
