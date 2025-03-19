import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import clipboard from "./clipboard";
import jsonStore from "./jsonStore";
import contextMenu from "./contextMenu";
import Snippets from "./Snippets";
import lsp from "./lsp";

export default {
	init: ipcRenderer.sendSync("init", "init"),
	
	clipboard,
	jsonStore,
	contextMenu,
	lsp,
	snippets: new Snippets(),
	
	openDialogWindow(name, dialogOptions) {
		return ipcRenderer.invoke("openDialogWindow", "open", name, dialogOptions);
	},
};
