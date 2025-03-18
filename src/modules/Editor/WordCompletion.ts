import regexMatches from "utils/regexMatches";
import regexMatch from "utils/regexMatch";
import {unique} from "utils/array";
import convertCase from "utils/convertCase";
import Selection, {s} from "modules/Selection";
import Cursor, {c} from "modules/Cursor";

function findCompletions(code, wordAtCursor, index, extraWords=[]) {
	let {left, right} = wordAtCursor;
	let caseTypes = getPossibleCaseTypes(left || right);
	let re;
	
	if (left) {
		re = new RegExp(`\\b${left}\\w+`, "gi");
	} else {
		re = new RegExp(`\\w+${right}\\b`, "gi");
	}
	
	let before = code.substr(0, index);
	let after = code.substr(index);
	
	let beforeInstances = regexMatches(before, re).reverse();
	let afterInstances = regexMatches(after, re);
	let extraInstances = regexMatches(extraWords.join(","), re);
	
	let words = [];
	
	for (let word of [...beforeInstances, ...afterInstances, ...extraInstances]) {
		let matchCaseTypes = getPossibleCaseTypes(word);
		let caseTypesOverlap = matchCaseTypes.some(caseType => caseTypes.includes(caseType));
		
		// original case can sometimes be lost in case detection and conversion,
		// so always include the exact word
		
		words.push({
			word,
			caseTypesOverlap,
			isOriginal: true,
		});
		
		for (let caseType of caseTypes) {
			let converted = convertCase[caseType](word);
			
			words.push({
				word: converted,
				caseTypesOverlap,
				isOriginal: word === converted,
			});
		}
	}
	
	let sortedWords = words.sort(function(a, b) {
		if (a.isOriginal && !b.isOriginal) {
			return -1;
		} else if (b.isOriginal && !a.isOriginal) {
			return 1;
		} else {
			if (a.caseTypesOverlap && !b.caseTypesOverlap) {
				return -1;
			} else if (b.caseTypesOverlap && !a.caseTypesOverlap) {
				return 1;
			} else {
				return 0;
			}
		}
	});
	
	return unique(sortedWords.map(w => w.word));
}

function getPossibleCaseTypes(word) {
	let prefix = regexMatch(word, /^[_\W]+/);
	
	word = word.substr(prefix.length);
	
	if (word.match(/^[A-Z]/) && !word.match(/[a-z]/)) {
		return ["constant"];
	} else if (word.match(/^[a-z]/)) {
		if (word.includes("_")) {
			return ["snake"];
		} else if (word.match(/[A-Z]/)) {
			return ["camel"];
		} else {
			return ["snake", "camel"];
		}
	} else if (word.match(/^[A-Z][a-z]/)) {
		return ["title"];
	} else {
		return ["constant", "title"];
	}
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
	
	nav(dir) {
		let {
			words,
			index,
			selection,
			originalWord,
		} = this.session;
		
		let {lineIndex, offset} = selection.start;
		
		let newIndex = index + dir;
		
		if (newIndex === words.length) {
			newIndex = -1;
		} else if (newIndex === -2) {
			newIndex = words.length - 1;
		}
		
		let nextWord;
		
		if (newIndex === -1) {
			nextWord = originalWord.left + originalWord.right;
		} else {
			nextWord = words[newIndex];
		}
		
		this.applyCompletion(selection, nextWord, originalWord);
		
		this.session = {
			...this.session,
			currentWord: nextWord,
			selection: s(selection.start, c(lineIndex, offset + nextWord.length)),
			index: newIndex,
		};
	}
	
	init() {
		let {editor} = this;
		let {document, normalSelection} = editor;
		let cursor = normalSelection.left;
		let {lineIndex, offset} = cursor;
		
		let wordAtCursor = document.wordAtCursor(cursor);
		let {left, right} = wordAtCursor;
		
		if (!left && !right) {
			return;
		}
		
		if (left && right) { // assume we want to complete the left side if there are chars to the right as well
			right = "";
			wordAtCursor = {left, right};
		}
		
		let index = document.indexFromCursor(cursor);
		let extraWords = editor.getExternalWordCompletionCandidates();
		
		let words = findCompletions(document.string, wordAtCursor, index, extraWords);
		
		if (words.length === 0) {
			return;
		}
		
		let currentWord = words[0];
		let selection = s(c(lineIndex, offset - left.length), c(lineIndex, offset + right.length));
		
		this.applyCompletion(selection, currentWord, wordAtCursor);
		
		this.session = {
			originalWord: wordAtCursor,
			currentWord,
			selection: s(selection.start, c(lineIndex, selection.start.offset + currentWord.length)),
			words,
			index: 0,
		};
	}
	
	completeWord() {
		this.inWordComplete = true;
		
		if (this.session) {
			this.nav(1);
		} else {
			this.init();
		}
		
		this.inWordComplete = false;
	}
	
	previous() {
		if (!this.session) {
			return;
		}
		
		this.inWordComplete = true;
		
		this.nav(-1);
		
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

export default WordCompletion;
