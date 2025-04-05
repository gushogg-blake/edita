import {Query} from "web-tree-sitter";
import type {LangModule} from "base/langs";

export default class Lang implements LangModule {
	constructor(langModule: LangModule) {
		Object.assign(this, langModule);
	}
	
	async initTreeSitterLanguage() {
		this.treeSitterLanguage = await platform.loadTreeSitterLanguage(this.code);
		
		// tree-sitter query creation is slow so pre-create them
		
		this.injections = (this.injections || []).map((injection) => {
			return {
				...injection,
				query: this.query(injection.pattern),
			};
		});
		
		this.queries = {
			error: this.query("(ERROR) @error"),
		};
	}
	
	query(string: string): Query {
		return new Query(this.treeSitterLanguage, string);
	}
}
