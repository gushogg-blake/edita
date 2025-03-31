import {Evented} from "utils";
import {removeInPlace} from "utils/array";
import type {Lang} from "core";
import SnippetsCommon, {type Snippet, type SnippetId} from "platforms/common/Snippets";
import ipcRenderer from "platforms/electron/modules/ipcRenderer";

export default class Snippets extends SnippetsCommon {
	private snippets: Snippet[] = [];
	
	constructor() {
		super();
		
		ipcRenderer.on("snippets/new", this.onNewSnippet.bind(this));
		ipcRenderer.on("snippets/update", this.onSnippetUpdated.bind(this));
		ipcRenderer.on("snippets/delete", this.onSnippetDeleted.bind(this));
	}
	
	async init(): void {
		this.snippets = await ipcRenderer.invoke("snippets", "load");
	}
	
	all(): Snippet[] {
		return this.snippets;
	}
	
	findByLangAndName(lang: Lang, name: string): Snippet? {
		return this.snippets.find(function(snippet) {
			return snippet.name === name && (
				snippet.langGroups.includes(lang.group)
				|| snippet.langs.includes(lang.code)
			);
		});
	}
	
	findByLangAndKeyCombo(lang: Lang, keyCombo: string): Snippet? {
		return this.snippets.find(function(snippet) {
			return snippet.keyCombo === keyCombo && (
				snippet.langGroups.includes(lang.group)
				|| snippet.langs.includes(lang.code)
			);
		});
	}
	
	onNewSnippet(e, snippet: Snippet) {
		this.snippets.push(snippet);
		
		this.fire("new", snippet);
	}
	
	onSnippetUpdated(e, id: SnippetId, snippet: Snippet) {
		this.snippets[this.findIndexById(id)] = snippet;
		
		this.fire("update", {id, snippet});
	}
	
	onSnippetDeleted(e, id: SnippetId) {
		this.remove(this.findById(id));
		
		this.fire("delete", id);
	}
	
	findById(id: SnippetId): Snippet? {
		return this.snippets.find(s => s.id === id);
	}
	
	protected findIndexById(id: SnippetId): number {
		return this.snippets.findIndex(s => s.id === id);
	}
	
	protected remove(snippet: Snippet): void {
		removeInPlace(this.snippets, snippet);
	}
	
	async create(snippet: Snippet): Promise<SnippetId> {
		return await ipcRenderer.invoke("snippets", "create", snippet);
	}
	
	async update(id: SnippetId, snippet: Snippet): Promise<void> {
		await ipcRenderer.invoke("snippets", "update", id, snippet);
	}
	
	async delete(id: SnippetId): Promise<void> {
		await ipcRenderer.invoke("snippets", "delete", id);
	}
}
