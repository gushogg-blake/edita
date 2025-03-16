import {mount, unmount} from "svelte";
import pages from "platforms/electron/pages";
import init from "platforms/electron/init";

// ENTRYPOINT main (renderer) process for Electron

let [, p] = location.href.match(/p=(\w+)/);
let page = pages[p];
let {App, AppComponent, useLangs=true} = page;
let isDialogWindow = p !== "main";

let app;
let appComponent;

init(async function(options) {
	// dialogs are re-inited every time they're invoked
	if (app) {
		app.teardown();
		
		unmount(appComponent);
		
		document.body.innerHTML = "";
	}
	
	if (isDialogWindow) {
		app = new App(options);
	} else {
		app = new App();
	}
	
	await app.init();
	
	appComponent = mount(AppComponent, {
		target: document.body,
		
		props: {
			app,
		},
	});
	
	// DEV:
	
	window.app = app;
}, {
	isDialogWindow,
	useLangs,
});
