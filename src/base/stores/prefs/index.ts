import {Singleton} from "base/stores";
import type {Prefs} from "base";
import defaultPrefs from "./defaultPrefs";
import migrations from "./migrations";

export default function() {
	return new Singleton<Prefs>("prefs", defaultPrefs, migrations);
}
