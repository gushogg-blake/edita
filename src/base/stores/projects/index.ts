import {JsonStore} from "base/stores";
import migrations from "./migrations";

export default function() {
	return new JsonStore("projects", null, migrations);
}
