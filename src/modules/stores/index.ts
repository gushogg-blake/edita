let JsonStore = require("modules/JsonStore");
let prefs = require("./prefs");
let themes = require("./themes");
let session = require("./session");

export default async function() {
	return {
		prefs: prefs(),
		themes: await themes(),
		session: session(),
		fileTree: new JsonStore("fileTree", {}),
		perFilePrefs: new JsonStore("perFilePrefs", {}),
		projects: new JsonStore("projects", null),
		findAndReplaceOptions: new JsonStore("findAndReplaceOptions", {}),
		findAndReplaceHistory: new JsonStore("findAndReplaceHistory", []),
		ephemeralUiState: new JsonStore("ephemeralUiState", null),
	};
}
