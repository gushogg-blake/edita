import ipcMain from "../modules/ipcMain";
import init from "./init";
import clipboard from "./clipboard";
import contextMenu from "./contextMenu";
import openDialogWindow from "./openDialogWindow";
import callOpener from "./callOpener";
import jsonStore from "./jsonStore";
import snippets from "./snippets";
import devTools from "./devTools";
import lsp from "./lsp";

let asyncModules = {
	contextMenu,
	openDialogWindow,
	callOpener,
	jsonStore,
	snippets,
	devTools,
	lsp,
};

let syncModules = {
	init,
	clipboard,
};

export default function(app) {
	for (let [key, module] of Object.entries(asyncModules)) {
		let fns = module(app);
		
		ipcMain.handle(key, function(e, method, ...args) {
			return fns[method](e, ...args);
		});
	}
	
	for (let [key, module] of Object.entries(syncModules)) {
		let fns = module(app);
		
		ipcMain.on(key, async function(e, method, ...args) {
			e.returnValue = await fns[method](e, ...args);
		});
	}
}
