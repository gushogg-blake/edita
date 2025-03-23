import {Document} from "modules/core";
import {Memory} from "modules/core/resources";
import dedent from "test/utils/dedent";

export default function(code) {
	return new Document(Memory.withLang(dedent(code), base.langs.get("javascript")));
}
