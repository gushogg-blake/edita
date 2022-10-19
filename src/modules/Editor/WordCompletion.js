let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let findWordCompletions = require("modules/utils/findWordCompletions");

let {s} = Selection;
let {c} = Cursor;

class WordCompletion {
	constructor(editor) {
		this.editor = editor;
	}
	
	applyCompletion(selection, word) {
		let {editor} = this;
		let {document} = editor;
		
		let {
			edit,
			newSelection,
		} = document.replaceSelection(selection, word);
		
		let edits = [edit];
		
		editor.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: editor.adjustSnippetSession(edits),
		});
		
		editor.updateSnippetExpressions();
	}
	
	completeWord() {
		if (this.editor.view.Selection.isFull()) {
			return;
		}
		
		this.inWordComplete = true;
		
		let {editor} = this;
		let {document, view, normalSelection} = editor;
		let cursor = Selection.sort(normalSelection).start;
		let {lineIndex, offset} = cursor;
		
		if (this.session) {
			let {
				words,
				index,
				selection,
				originalWord,
			} = this.session;
			
			let {lineIndex, offset} = selection.start;
			
			let newIndex = index + 1;
			
			if (newIndex === words.length) {
				newIndex = -1;
			}
			
			let nextWord;
			
			if (newIndex === -1) {
				nextWord = originalWord;
			} else {
				nextWord = words[newIndex];
			}
			
			this.applyCompletion(selection, nextWord);
			
			this.session = {
				...this.session,
				currentWord: nextWord,
				selection: s(selection.start, c(lineIndex, offset + nextWord.length)),
				index: newIndex,
			};
		} else {
			let wordAtCursor = document.wordAtCursor(cursor);
			
			if (wordAtCursor) {
				let {path} = document;
				let index = document.indexFromCursor(cursor);
				let extraWords = [path && platform.fs(path).basename].filter(Boolean);
				let words = findWordCompletions(document.string, wordAtCursor, index, extraWords);
				
				if (words.length > 0) {
					let currentWord = words[0];
					let selection = s(c(lineIndex, offset - wordAtCursor.length), cursor);
					
					this.applyCompletion(selection, currentWord);
					
					this.session = {
						originalWord: wordAtCursor,
						currentWord,
						selection: s(selection.start, c(lineIndex, selection.start.offset + currentWord.length)),
						words,
						index: 0,
					};
				}
			}
		}
		
		this.inWordComplete = false;
	}
	
	selectionChanged() {
		// clear word completion session (word completion changes the selection,
		// so only clear it if something else changed the selection)
		
		if (!this.inWordComplete) {
			this.session = null;
		}
	}
}

module.exports = WordCompletion;
