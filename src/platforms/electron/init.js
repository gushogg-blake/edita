import getKeyCombo from "utils/getKeyCombo";
import Base from "modules/Base";
import components from "components";
import Platform from "./Platform";

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

export default async function(init, options={}) {
	let {
		isDialog = false,
		initLangs = true,
	} = options;
	
	window.platform = new Platform();
	
	await platform.init();
	
	window.base = new Base();
	
	await base.init(components, {
		initLangs,
	});
	
	if (isDialog) {
		platform.on("dialogInit", init);
	} else {
		init();
	}
}
