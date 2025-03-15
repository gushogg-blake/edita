import JsonStore from "modules/JsonStore";
import prefs from "./prefs";
import themes from "./themes";
import session from "./session";

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
