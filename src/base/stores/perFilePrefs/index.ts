import {JsonStore} from "base/stores";
import migrations from "./migrations";

export default function() {
	return new JsonStore("perFilePrefs", {}, migrations);
}
