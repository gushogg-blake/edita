import {Singleton} from "base/stores";
import migrations from "./migrations";

export default function() {
	return new Singleton("session", null, migrations);
}
