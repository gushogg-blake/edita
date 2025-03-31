import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import jsonStore from "./jsonStore";
import contextMenu from "./contextMenu";
import Snippets from "./Snippets";
import lsp from "./lsp";

export default {
	init: ipcRenderer.sendSync("init", "init"),
	
	jsonStore,
	contextMenu,
	lsp,
	snippets: new Snippets(),
	
	openDialogWindow(name, dialogOptions) {
		return ipcRenderer.invoke("openDialogWindow", "open", name, dialogOptions);
	},
};
