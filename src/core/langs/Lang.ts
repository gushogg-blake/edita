import {Query} from "web-tree-sitter";

export default class Lang {
	group: string;
	code: string;
	name: string;
	defaultExtension: string;
	astMode?: AstMode; // TYPE
	codeIntel?: CodeIntel; // TYPE
	accelerator?: string;
	
	// whether the lang should be available as a file type or is an internal util
	// (markdown_inline for example)
	util: boolean;
	
	treeSitterLanguage: Language;
	queries: Record<string, Query>;
	injections: Injection[];
	
	constructor() {
		
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
