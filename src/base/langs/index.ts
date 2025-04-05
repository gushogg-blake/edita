import type {Query, Language} from "web-tree-sitter";
import {Lang} from "core";
import type {CaptureSingleResult} from "core/Tree";
import * as langModules from "./modules";

type AstMode = {
	// see LangModule.init
	init?: (env: any) => void;
	
	pickOptions,
	dropTargets,
	astManipulations,
	
	adjustSpaces(
		document,
		fromSelection,
		toSelection,
		selectionLines,
		insertLines,
		insertIndentLevel,
	) {
};

type Injection = {
	pattern: string; // TYPE? TSQ
	lang: string | (capture: CaptureSingleResult) => Lang;
	query: Query;
	combined?: boolean;
	excludeChildren?: boolean;
};

export interface LangModule {
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
}

class Langs {
	langs: Record<string, Lang> = {};
	
	add(langModule) {
		let lang = new Lang(langModule);
		
		this.langs[lang.code] = lang;
	}
	
	get(code: string): Lang | null {
		return this.langs[code] || null;
	}
	
	get all(): Lang[] {
		return Object.values(this.langs);
	}
}

export default function() {
	let langs = new Langs();
	
	for (let langModule of Object.values(langModules)) {
		langs.add(langModule);
	}
	
	return langs;
}
