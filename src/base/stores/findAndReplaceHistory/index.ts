import {Singleton} from "base/stores";
import type {FindAndReplaceOptions} from "modules/findAndReplace";
import migrations from "./migrations";

export default function() {
	return new Singleton<FindAndReplaceOptions[]>("findAndReplaceHistory", [], migrations);
}
