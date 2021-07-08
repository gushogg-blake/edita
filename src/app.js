import js from "./modules/langs/js";

import getKeyCombo from "./utils/getKeyCombo";
import init from "./modules/ipc/init/renderer";
import App from "./components/App.svelte";

(async function() {
	console.log(";;asd");
	await TreeSitter.init();
	await js.init();
	
	window.systemInfo = await init.getSystemInfo();
	
	let app = new App({
		target: document.body,
	});
	
	window.app = app;
})();

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

console.warn = _ => null;
