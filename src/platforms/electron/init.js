import getKeyCombo from "utils/getKeyCombo";
import Base from "modules/Base";
import components from "components";
import Platform from "./Platform";

window.platform = new Platform();
window.base = new Base();

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
		require("electron").ipcRenderer.invoke("devTools", "open");
	}
});

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

export default async function(init, isDialog=false) {
	await platform.init();
	await base.init(components);
	
	if (isDialog) {
		platform.on("dialogInit", init);
	} else {
		init();
	}
}
