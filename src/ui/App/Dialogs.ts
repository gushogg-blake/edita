import type {PromiseWithMethods} from "utils";
import type App from "ui/App";
import showSyntheticDialog from "./showSyntheticDialog";

type OpenDialogMode = "selectDir" | "selectFiles" | "save";

export default class {
	private showSyntheticDialog: (
		name: string,
		options: any,
		windowOptions: any,
	) => Promise<PromiseWithMethods<any>>; // TYPE dialog response
	
	private app: App;
	
	constructor(app: App) {
		this.app = app;
		
		this.showSyntheticDialog = (dialogName, dialogOptions, windowOptions) => {
			return showSyntheticDialog(
				dialogName,
				dialogOptions,
				windowOptions,
				
				(div) => {
					app.renderDiv(div);
				},
			);
		};
	}
	
	async _showOpen(dir: string, mode: OpenDialogMode): Promise<string[]> {
		if (!dir) {
			dir = this.app.getCurrentDir();
		}
		
		let {canceled, paths} = await this.dialogPromise("fileChooser", {
			path: dir,
			mode,
		});
		
		if (canceled) {
			return [];
		}
		
		return paths;
	}
	
	showOpen(dir: string = null): Promise<string[]> {
		return this._showOpen(dir, "selectFiles");
	}
	
	showChooseDir(startDir: string = null): Promise<string[]> {
		return this._showOpen(startDir, "selectDir");
	}
	
	async showSaveAs(options): Promise<string | null> {
		let {canceled, path} = await this.dialogPromise("fileChooser", {
			mode: "save",
			...options,
		});
		
		return path || null;
	}
	
	private dialogPromise(name: string, options, windowOptions = {}): PromiseWithMethods<any> {
		return platform.dialogPromise(this.showSyntheticDialog, name, options, windowOptions);
	}
	
	private openDialogWindow(name: string, options, windowOptions = {}): void {
		platform.openDialogWindow(this.showSyntheticDialog, name, options, windowOptions);
	}
	
	newSnippet(details = {}) {
		this.openDialogWindow("snippetEditor", {
			id: null,
			details,
		}, {
			title: "New snippet",
			width: 680,
			height: 480,
		});
	}
	
	editSnippet(id: string) {
		this.openDialogWindow("snippetEditor", {
			id,
		}, {
			title: "Edit snippet",
			width: 680,
			height: 480,
		});
	}
	
	showMessageBox(options) {
		return this.dialogPromise("messageBox", options, {
			width: 500,
			height: 75,
		});
	}
}
