let regexMatches = require("utils/regexMatches");
let unique = require("utils/array/unique");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

function findCompletions(code, wordAtCursor, index, extraWords=[]) {
	let [left, right] = wordAtCursor;
	let re;
	
	if (left && right) {
		re = new RegExp(`\\b${left}\\w+${right}\\b`, "gi");
	} else if (left) {
		re = new RegExp(`\\b${left}\\w+`, "gi");
	} else if (right) {
		re = new RegExp(`\\w+${right}\\b`, "gi");
	}
	
	let before = code.substr(0, index);
	let after = code.substr(index);
	
	let beforeInstances = regexMatches(before, re).reverse();
	let extraInstances = regexMatches(extraWords.join(","), re);
	let afterInstances = regexMatches(after, re);
	
	return unique([...beforeInstances, ...extraInstances, ...afterInstances]);
}

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
			let [left, right] = wordAtCursor;
			
			if (!left || right) { // TODO left only for now
				this.inWordComplete = false;
				
				return;
			}
			
			if (!left && !right) {
				this.inWordComplete = false;
				
				return;
			}
			
			let {path} = document;
			let index = document.indexFromCursor(cursor);
			let extraWords = [path && platform.fs(path).basename].filter(Boolean);
			
			let words = findCompletions(document.string, wordAtCursor, index, extraWords);
			
			if (words.length > 0) {
				let currentWord = words[0];
				let selection = s(c(lineIndex, offset - left.length), cursor);
				
				this.applyCompletion(selection, currentWord);
				
				this.session = {
					originalWord: left, //
					currentWord,
					selection: s(selection.start, c(lineIndex, selection.start.offset + currentWord.length)),
					words,
					index: 0,
				};
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
