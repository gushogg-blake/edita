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
	options = {
		isDialog: false,
		useBase: true,
		...options,
	};
	
	window.platform = new Platform();
	
	await platform.init();
	
	if (options.useBase) {
		window.base = new Base();
		
		await base.init(components);
	}
	
	if (options.isDialog) {
		platform.on("dialogInit", init);
	} else {
		init();
	}
}
