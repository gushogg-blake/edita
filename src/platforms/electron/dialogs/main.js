import init from "platform/init";

export default function(App, AppComponent, initLangs=true) {
	let app;
	let appComponent;
	
	init(async function(options) {
		if (app) {
			app.teardown();
			appComponent.$destroy();
			
			document.body.innerHTML = "";
		}
		
		app = new App(options);
		
		await app.init();
		
		appComponent = new AppComponent({
			target: document.body,
			
			props: {
				app,
			},
		});
		
		// DEV:
		
		window.app = app;
	}, {
		isDialog: true,
		initLangs,
	});
}
