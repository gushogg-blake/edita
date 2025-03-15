import Document from "modules/Document";
import URL from "modules/URL";
import dedent from "test/utils/dedent";

export default function(code) {
	return new Document(dedent(code), new URL("new:///a.js"));
}
