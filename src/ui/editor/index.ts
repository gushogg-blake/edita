import type {Cursor} from "core";

export {PickOption, DropTarget} from "./astMode";

export type EditorMode = "normal" | "ast";

// stuff the Editor needs from outside, e.g. LSP, word completions
// from other tabs' filenames

export interface EditorEnv {
	getWordCompletionCandidates(): string[];
	
	lsp: {
		getCompletions(cursor: Cursor): Promise<any[]>; // TYPE LSP response
		getDefinitions(cursor: Cursor): Promise<any[]>; // TYPE LSP response
	};
	
	findReferences(cursor: Cursor): Promise<void>;
	goToDefinition(definition: any): Promise<void>; // TYPE LSP response (or we convert it into our own)
}

export {default as Editor} from "./Editor";
