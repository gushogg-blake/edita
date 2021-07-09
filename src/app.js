// HACK for https://github.com/sindresorhus/electron-better-ipc/issues/35
// TODO might not be needed anymore
require("electron").ipcRenderer.addListener("fix-event-79558e00-29ef-5c7f-84bd-0bcd9a0c5cf3", () => {});

import getKeyCombo from "./utils/getKeyCombo";
import App from "./components/App.svelte";

import js from "./modules/langs/js";

(async function() {
	await TreeSitter.init();
	await js.init();
	
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
