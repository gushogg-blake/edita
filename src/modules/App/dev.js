let sleep = require("utils/sleep");

function get(key) {
	return base.getPref("dev." + key);
}

module.exports = async function(app) {
	await sleep(0);
	
	setInterval(() => {
		if (get("logFocusedElement")) {
			console.log(app.selectedTab.editor.view.focused);
			console.log(document.activeElement);
		}
	}, 1000);
	
	if (get("openFindAndReplace")) {
		app.showFindAndReplace();
	}
}
