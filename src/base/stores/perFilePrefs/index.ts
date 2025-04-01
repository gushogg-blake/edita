import JsonStore from "base/stores/JsonStore";
import migrations from "./migrations";

export default function() {
	return new JsonStore("projects", {}, migrations);
}
