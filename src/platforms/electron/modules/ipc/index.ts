import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import jsonStore from "./jsonStore";
import contextMenu from "./contextMenu";
import lsp from "./lsp";

export default {
	init: ipcRenderer.sendSync("init", "init"),
	
	jsonStore,
	contextMenu,
	lsp,
	
	openDialogWindow(name, dialogOptions) {
		return ipcRenderer.invoke("openDialogWindow", "open", name, dialogOptions);
	},
};
