import Evented from "utils/Evented";
import type {Lang} from "core";

export type SnippetId = string;

export type Snippet = {
	id?: SnippetId;
	name: string;
	langGroups: string[];
	langs: string[];
	text: string;
	keyCombo: string | null;
};

export default abstract class Snippets extends Evented<{
	update: {id: SnippetId; snippet: Snippet};
	new: Snippet;
	delete: SnippetId;
}> {
	abstract init(): Promise<void>;
	
	abstract all(): Snippet[];
	
	abstract findByLangAndName(lang: Lang, name: string): Snippet?;
	
	abstract findByLangAndKeyCombo(lang: Lang, keyCombo: string): Snippet?;
	
	abstract create(snippet: Snippet): Promise<SnippetId>;
	
	abstract update(id: SnippetId, snippet: Snippet): Promise<void>;
	
	abstract delete(id: Snippet): Promise<void>;
	
	abstract findById(id): Snippet?;
	
	protected abstract findIndexById(id: SnippetId): Snippet?;
	
	protected abstract remove(snippet: Snippet): void;
}
