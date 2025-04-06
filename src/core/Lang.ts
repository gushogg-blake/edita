import {Query} from "web-tree-sitter";
import type {CaptureSingleResult} from "core/Tree";

// wrapped in partial to avoid errors as query is added later
// ? used to mark things as actually optional
export type Injection = Partial<{
	pattern: string;
	lang: string | (capture: CaptureSingleResult) => string;
	query: Query;
	combined?: boolean;
	excludeChildren?: boolean;
}>;

//interface ILang {
//	
//}

type SupportLevel = "specific" | "general" | "alternate" | null;

export default abstract class Lang {
	code: string;
	group?: string;
	name: string;
	defaultExtension?: string;
	
	// whether the lang should be available as a file type or is an internal util
	// (markdown_inline for example)
	util?: boolean;
	
	treeSitterLanguage: Language;
	queries: Record<string, Query>;
	injections: Injection[];
	
	constructor(langCode: string) {
		this.code = langCode;
	}
	
	get astIntel() {
		return base.astIntel.get(this.code);
	}
	
	get codeIntel() {
		return base.codeIntel.get(this.code);
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
	
	abstract getSupportLevel(code: string, path: string): string; // TYPE SupportLevel;
}
