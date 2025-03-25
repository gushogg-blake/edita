import {Document} from "core";
import {Memory} from "core/resource";

export default async function(code): Promise<Document> {
	let lang = base.langs.get("javascript");
	let file = await Memory.withLang(code, lang);
	
	return new Document(file);
}
