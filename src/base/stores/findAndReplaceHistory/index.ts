import Singleton from "base/stores/Singleton";
import migrations from "./migrations";

export default function() {
	return new Singleton("findAndReplaceHistory", [], migrations);
}
