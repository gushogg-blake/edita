import Singleton from "base/stores/Singleton";
import type {Prefs} from "base/types";
import defaultPrefs from "./defaultPrefs";
import migrations from "./migrations";

export default function() {
	return new Singleton<Prefs>("prefs", defaultPrefs, migrations);
}
