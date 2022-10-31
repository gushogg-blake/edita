let JsonStore = require("modules/JsonStore");
let prefs = require("./prefs");
let themes = require("./themes");

module.exports = async function() {
	return {
		prefs: prefs(),
		themes: await themes(),
		session: new JsonStore("session", null),
		findAndReplaceOptions: new JsonStore("findAndReplaceOptions", {}),
		fileTree: new JsonStore("fileTree", {}),
		perFilePrefs: new JsonStore("perFilePrefs", {}),
		projects: new JsonStore("projects", null),
	};
}
