import {Document} from "modules/core";
import {Memory} from "modules/core/resource";

export default async function(code): Promise<Document> {
	let lang = base.langs.get("javascript");
	let file = await Memory.withLang(code, lang);
	
	return new Document(file);
}
