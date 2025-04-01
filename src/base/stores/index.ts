import ephemeralUiState from "./ephemeralUiState";
import fileTree from "./fileTree";
import findAndReplaceHistory from "./findAndReplaceHistory";
import findAndReplaceOptions from "./findAndReplaceOptions";
import prefs from "./prefs";
import projects from "./projects";
import session from "./session";
import snippets from "./snippets";
import themes from "./themes";

export default async function() {
	return {
		ephemeralUiState: await ephemeralUiState(),
		fileTree: await fileTree(),
		findAndReplaceHistory: await findAndReplaceHistory(),
		findAndReplaceOptions: await findAndReplaceOptions(),
		prefs: await prefs(),
		projects: await projects(),
		session: await session(),
		snippets: await snippets(),
		themes: await themes(),
	};
}
