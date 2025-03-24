/*
REFACTOR core (File & Document) shouldn't know about Projects or LSP

keep these in Editor, App, etc
*/

export default class LspHelpers {
	constructor(document) {
		this.document = document;
	}
	
	get lspClient() {
		return this.document.project?.lspClient;
	}
	
	listSymbols() {
		return this.lspClient?.listSymbols(this.document);
	}
	
	getCompletions(cursor) {
		return this.lspClient?.getCompletions(this.document, cursor);
	}
	
	getDefinitions(cursor) {
		return this.lspClient?.getDefinitions(this.document, cursor);
	}
	
	findReferences(cursor) {
		return this.lspClient?.findReferences(this.document, cursor);
	}
}
