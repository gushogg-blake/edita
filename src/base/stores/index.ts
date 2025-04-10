import type JsonStore from "./JsonStore";
import type Singleton from "./Singleton";
import type {SnippetsStore} from "./snippets";

import ephemeralUiState from "./ephemeralUiState";
import fileTree from "./fileTree";
import findAndReplaceHistory from "./findAndReplaceHistory";
import findAndReplaceOptions from "./findAndReplaceOptions";
import perFilePrefs from "./perFilePrefs";
import prefs from "./prefs";
import projects from "./projects";
import session from "./session";
import snippets from "./snippets";
import themes from "./themes";

export {default as JsonStore} from "./JsonStore";
export {default as Singleton} from "./Singleton";

export type Stores = {
	ephemeralUiState: Singleton;
	fileTree: Singleton;
	findAndReplaceHistory: Singleton;
	findAndReplaceOptions: Singleton;
	perFilePrefs: JsonStore;
	prefs: Singleton;
	projects: JsonStore;
	session: Singleton;
	snippets: SnippetsStore;
	themes: JsonStore;
};

export default async function() {
	return {
		ephemeralUiState: await ephemeralUiState(),
		fileTree: await fileTree(),
		findAndReplaceHistory: await findAndReplaceHistory(),
		findAndReplaceOptions: await findAndReplaceOptions(),
		perFilePrefs: await perFilePrefs(),
		prefs: await prefs(),
		projects: await projects(),
		session: await session(),
		snippets: await snippets(),
		themes: await themes(),
	};
}
