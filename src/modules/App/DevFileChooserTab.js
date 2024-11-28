let Tab = require("modules/App/Tab");
let FileChooserApp = require("platforms/electron/dialogs/fileChooser/FileChooserApp");

class DevFileChooserTab extends Tab {
	constructor(app) {
		super(app, "devFileChooser");
		
		this.fileChooserApp = new FileChooserApp({
			mode: "selectFiles",
			path: "/",
		});
		
		this.teardownCallbacks = [
			
		];
	}
	
	async init() {
		await this.fileChooserApp.init();
	}
	
	get label() {
		return "File chooser";
	}
	
	get url() {
		return "dev://file-chooser";
	}

	get windowTitle() {
		return "file chooser";
	}
	
	focus() {
		
	}
	
	show() {
		
	}
	
	hide() {
		
	}
	
	saveState() {
		
	}
	
	restoreState(details) {
		
	}
	
	teardown() {
		super.teardown();
	}
}

module.exports = DevFileChooserTab;
