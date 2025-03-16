import Tab from "modules/App/Tab";
import FileChooserApp from "platforms/electron/pages/fileChooser/App";

class DevFileChooserTab extends Tab {
	constructor(app, options) {
		super(app, "devFileChooser");
		
		this.fileChooserApp = new FileChooserApp(options);
		
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

export default DevFileChooserTab;
