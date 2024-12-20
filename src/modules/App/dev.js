let sleep = require("utils/sleep");
let Selection = require("modules/Selection");
let DevFileChooserTab = require("./DevFileChooserTab");

function get(key) {
	return base.getPref("dev." + key);
}

module.exports = async function(app) {
	await sleep(0);
	
	setInterval(() => {
		if (get("logFocusedElement")) {
			console.log(app.selectedTab?.editor.view.focused);
			console.log(document.activeElement);
		}
	}, 1000);
	
	if (get("openFindAndReplace")) {
		app.showFindAndReplace();
	}
	
	if (get("openRefactor")) {
		await app.refactor(["/home/gus/projects/edita/src/modules/langs"]);
		
		let {refactor} = app.bottomPanes.tools.tabs[1];
		
		await sleep(200);
		
		//refactor.editors.find.api.edit(Selection.start(), `let /\\w+/ = require\\((string)\\);`);
		//refactor.editors.replaceWith.api.edit(Selection.start(), `@string`);
	}
	
	if (get("openFileChooser")) {
		let tab = new DevFileChooserTab(app, {
			mode: "save",
			path: platform.systemInfo.homeDir + "/" + "test.js",
		});
		
		app.tabs.push(tab);
		
		tab.init();
		
		app.fire("updateTabs");
		
		app.selectTab(tab);
	}
}
