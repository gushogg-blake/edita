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
	
	debugger
	
	let app = new App();
	
	await app.init();
	
	new components.App({
		target: document.body,
		
		props: {
			app,
		},
	});
	
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
