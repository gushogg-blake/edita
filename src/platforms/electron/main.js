import getKeyCombo from "utils/getKeyCombo";
import Base from "modules/Base";
import App from "modules/App";
import components from "components";
import Platform from "./Platform";

window.platform = new Platform();
window.base = new Base(components);

(async function() {
	await platform.init();
	await base.init();
	
	let app = new App();
	
	new components.App({
		target: document.body,
		
		props: {
			app,
		},
	});
	
	if (platform.isMainWindow) {
		await app.loadSession();
		
		for (let path of platform.getFilesToOpenOnStartup()) {
			await app.openFile(path);
		}
		
		window.addEventListener("beforeunload", function() {
			app.saveSession();
		});
	}
	
	if (app.tabs.length === 0) {
		app.newFile();
	}
	
	// DEV:
	
	window.app = app;
})();

// misc shims etc:

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
		require("electron").ipcRenderer.invoke("devTools/open");
	}
});

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
