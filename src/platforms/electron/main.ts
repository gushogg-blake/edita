import "css/global.scss";
import "platforms/electron/css/app.scss";
import {mount, unmount} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import {App} from "ui/app";
import dialogs from "ui/dialogs";
import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import AppComponent from "components/App/App.svelte";
import DialogWrapper from "platforms/electron/components/DialogWrapper.svelte";
import components from "components";
import {setGlobals} from "platforms/common/globals";
import Platform from "platforms/electron/Platform";

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

setGlobals(Platform);

// ENTRYPOINT main (renderer) process for Electron

let [, dialogName] = location.href.match(/dialog=(\w+)/) || [];
let isDialogWindow = !!dialogName;

async function init(options) {
	let {useLangs} = options;
	
	await platform.init();
	
	await base.init(components, {
		useLangs,
	});
}

if (isDialogWindow) {
	let AppClass = dialogs[dialogName];
	
	await init({
		useLangs: !!AppClass.requiresTreeSitter,
	});
	
	// dialogs are re-inited every time they're invoked
	let teardownFn;
	
	ipcRenderer.handle("dialogInit", async (e, dialogOptions) => {
		if (teardownFn) {
			teardownFn();
		}
		
		let app = new AppClass({
			close() {
				window.close();
			},
			
			setTitle(title) {
				document.title = title;
			},
			
			respond(response) {
				platform.callOpener("dialogResponse", {
					name: dialogName,
					response,
				});
			},
		}, dialogOptions);
		
		await app.init();
		
		let dialogWrapperComponent = mount(DialogWrapper, {
			target: document.body,
			
			props: {
				app,
				Component: base.components.dialogs[dialogName],
			},
		});
		
		let teardown = [
			function() {
				app.teardown();
				
				unmount(dialogWrapperComponent);
				
				document.body.innerHTML = "";
			},
			
			platform.on("dialogClosed", function() {
				if (app.notifyClosed) {
					app.notifyClosed();
				}
			}),
		];
		
		teardownFn = function() {
			for (let fn of teardown) {
				fn();
			}
		}
		
		// DEV:
		
		window.app = app;
	});
} else {
	await init({
		useLangs: true,
	});
	
	let app = new App();
	
	await app.init();
	
	let appComponent = mount(AppComponent, {
		target: document.body,
		
		props: {
			app,
		},
	});
	
	// DEV:
	
	window.app = app;
}

let preventDefaultCombos = [
	"Ctrl+W",
	"Ctrl+-",
	"Ctrl++",
	"Ctrl+0",
];

window.addEventListener("keydown", function(e) {
	let {keyCombo} = getKeyCombo(e);
	
	if (preventDefaultCombos.includes(keyCombo)) {
		e.preventDefault();
	}
	
	if (keyCombo === "Ctrl+Shift+J") {
		ipcRenderer.invoke("devTools", "open");
	}
});
