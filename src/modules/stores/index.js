let JsonStore = require("modules/JsonStore");
let prefs = require("./prefs");

module.exports = function() {
	return {
		prefs: prefs(),
		session: new JsonStore("session", {}),
		findAndReplaceOptions: new JsonStore("findAndReplaceOptions", {}),
		fileTree: new JsonStore("fileTree", {}),
		perFilePrefs: new JsonStore("perFilePrefs", {}),
	};
}
