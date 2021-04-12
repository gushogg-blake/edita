// HACK for https://github.com/sindresorhus/electron-better-ipc/issues/35
require("electron").ipcRenderer.addListener("fix-event-79558e00-29ef-5c7f-84bd-0bcd9a0c5cf3", () => {});

import getKeyCombo from "./utils/getKeyCombo";
import App from "./App.svelte";

let app = new App({
	target: document.body,
});

window.app = app;

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

export default app;
