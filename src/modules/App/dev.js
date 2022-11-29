let sleep = require("utils/sleep");

module.exports = async function(app) {
	await sleep(0);
	
	let prefs = base.prefs.dev;
	
	setInterval(() => {
		if (prefs.pollFocusedElement) {
			console.log(app.selectedTab.editor.view.focused);
			console.log(document.activeElement);
		}
	}, 1000);
	
	if (prefs.showFindAndReplace) {
		app.showFindAndReplace();
	}
}
