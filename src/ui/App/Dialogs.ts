import showSyntheticDialog from "./showSyntheticDialog";

export default class {
	constructor(app) {
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
	
	async _showOpen(dir, mode) {
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
	
	showOpen(dir=null) {
		return this._showOpen(dir, "selectFiles");
	}
	
	showChooseDir(startDir=null) {
		return this._showOpenDialog(startDir, "selectDir");
	}
	
	async showSaveAs(options) {
		let {canceled, path} = await this.dialogPromise("fileChooser", {
			mode: "save",
			...options,
		});
		
		return path || null;
	}
	
	dialogPromise(name, options, windowOptions) {
		return platform.dialogPromise(this.showSyntheticDialog, name, options, windowOptions);
	}
	
	openDialogWindow(name, options, windowOptions) {
		platform.openDialogWindow(this.showSyntheticDialog, name, options, windowOptions);
	}
	
	newSnippet(details={}) {
		this.openDialogWindow("snippetEditor", {
			id: null,
			details,
		}, {
			title: "New snippet",
			width: 680,
			height: 480,
		});
	}
	
	editSnippet(id) {
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
