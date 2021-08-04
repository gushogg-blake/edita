import getKeyCombo from "../../../utils/getKeyCombo";
import Ui from "../../../components/Ui/Ui.svelte";
import Platform from "./Platform";
import App from "./App";

window.platform = new Platform();
window.app = new App();

(async function() {
	await app.init();
	
	new Ui({
		target: document.body,
	});
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
