import getKeyCombo from "./utils/getKeyCombo";
import Ui from "./components/Ui.svelte";
import Platform from "./Platform";
import App from "./App";

/*
top-level entry point for clientside JS (electron).

create App instance, which represents the entire app (within the current
Electron window).

create top-level Svelte component
*/

window.platform = new Platform();

(async function() {
	let app = new App();
	
	await app.init();
	
	window.app = app;
	
	let ui = new Ui({
		target: document.body,
	});
	
	// handy for debugging:
	window.ui = ui;
})();

// misc shims etc:

let preventDefaultCombos = [
	"Ctrl+W",
	"Ctrl+-",
	"Ctrl++",
	"Ctrl+0",
];

window.addEventListener("keydown", function(e) {
	if (preventDefaultCombos.includes(getKeyCombo(e).keyCombo)) {
		e.preventDefault();
	}
});

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
