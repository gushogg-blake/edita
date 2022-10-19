let regexMatches = require("utils/regexMatches");
let unique = require("utils/array/unique");
let convertCase = require("utils/convertCase");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

function findCompletions(code, wordAtCursor, index, extraWords=[]) {
	let {left, right} = wordAtCursor;
	let re;
	
	if (left) {
		re = new RegExp(`\\b${left}\\w+`, "gi");
	} else {
		re = new RegExp(`\\w+${right}\\b`, "gi");
	}
	
	let before = code.substr(0, index);
	let after = code.substr(index);
	
	let beforeInstances = regexMatches(before, re).reverse();
	let extraInstances = regexMatches(extraWords.join(","), re);
	let afterInstances = regexMatches(after, re);
	
	return unique([...beforeInstances, ...extraInstances, ...afterInstances]);
}

function getCaseType(word) {
	if (word.match(/^[a-z]/)) {
		return word.substr(1).includes("_") ? "snake" : "camel";
	} else if (word.match(/^[A-Z]{2,}/)) {
		return "constant";
	} else if (word.match(/^[A-Z][a-z]/)) {
		return "title";
	} else {
		return null;
	}
}

function _convertCase(word, caseType) {
	return caseType ? convertCase[caseType](word) : word;
}

class WordCompletion {
	constructor(editor) {
		this.editor = editor;
	}
	
	applyCompletion(selection, word, originalWord) {
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
	
	_completeWord() {
		let {editor} = this;
		let {document, view, normalSelection} = editor;
		let cursor = Selection.sort(normalSelection).start;
		let {lineIndex, offset} = cursor;
		
		if (view.Selection.isFull()) {
			return;
		}
		
		if (this.session) {
			let {
				words,
				index,
				selection,
				originalWord,
				caseType,
			} = this.session;
			
			let {lineIndex, offset} = selection.start;
			
			let newIndex = index + 1;
			
			if (newIndex === words.length) {
				newIndex = -1;
			}
			
			let nextWord;
			
			if (newIndex === -1) {
				nextWord = originalWord.left + originalWord.right;
			} else {
				nextWord = _convertCase(words[newIndex], caseType);
			}
			
			this.applyCompletion(selection, nextWord, originalWord);
			
			this.session = {
				...this.session,
				currentWord: nextWord,
				selection: s(selection.start, c(lineIndex, offset + nextWord.length)),
				index: newIndex,
			};
		} else {
			let wordAtCursor = document.wordAtCursor(cursor);
			let {left, right} = wordAtCursor;
			
			if (!left && !right) {
				return;
			}
			
			if (left && right) { // assume we want to complete the left side if there are chars to the right as well
				right = "";
				wordAtCursor = {left, right};
			}
			
			let {path} = document;
			let index = document.indexFromCursor(cursor);
			let extraWords = [path && platform.fs(path).basename].filter(Boolean);
			
			let words = findCompletions(document.string, wordAtCursor, index, extraWords);
			
			if (words.length === 0) {
				return;
			}
			
			let caseType = getCaseType(left + right);
			let currentWord = _convertCase(words[0], caseType);
			let selection = s(c(lineIndex, offset - left.length), c(lineIndex, offset + right.length));
			
			this.applyCompletion(selection, currentWord, wordAtCursor);
			
			this.session = {
				originalWord: wordAtCursor,
				currentWord,
				selection: s(selection.start, c(lineIndex, offset + currentWord.length)),
				words,
				index: 0,
				caseType,
			};
		}
	}
	
	completeWord() {
		this.inWordComplete = true;
		
		this._completeWord();
		
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
