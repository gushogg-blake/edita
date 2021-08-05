import getKeyCombo from "../../../utils/getKeyCombo";
import AppComponent from "../../../components/App/App.svelte";
import Platform from "./Platform";
import Base from "./Base";
import App from "./App";

window.platform = new Platform();
window.base = new Base();

(async function() {
	await base.init();
	
	new AppComponent({
		target: document.body,
		
		props: {
			app: new App(),
		},
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
