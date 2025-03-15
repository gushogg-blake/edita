import bindFunctions from "utils/bindFunctions";
import createDialogComponent from "./createDialogComponent";
import openDialogWindow from "./openDialogWindow";

export default function(app) {
	let _createDialogComponent = bindFunctions(app, createDialogComponent);
	let _openDialogWindow = openDialogWindow(app, _createDialogComponent);
	
	return _openDialogWindow;
}
