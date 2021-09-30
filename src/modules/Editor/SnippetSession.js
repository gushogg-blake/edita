let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let parsePlaceholders = require("modules/utils/parsePlaceholders");
let stringToLineTuples = require("modules/utils/stringToLineTuples");
let lineTuplesToStrings = require("modules/utils/lineTuplesToStrings");

let {s} = Selection;
let {c} = Cursor;

let api = {
	insert(document, selection, snippet, replaceWord)  {
		let {start} = selection;
		let {lineIndex, offset} = start;
		let {indentLevel} = document.lines[lineIndex];
		let indentStr = document.fileDetails.indentation.string;
		let lineTuples = stringToLineTuples(snippet.text);
		let lineStrings = lineTuplesToStrings(lineTuples, indentStr, indentLevel, true);
		let indentedSnippet = lineStrings.join(document.fileDetails.newline);
		
		let editSelection = (
			replaceWord
			? s(c(lineIndex, offset - replaceWord.length), start)
			: selection
		);
		
		let {
			replacedString,
			placeholders,
		} = parsePlaceholders(indentedSnippet, editSelection.start.lineIndex, editSelection.start.offset);
		
		let {end: endCursor} = document.getSelectionContainingString(editSelection.start, replacedString);
		let edit = document.edit(editSelection, replacedString);
		
		let session = placeholders.length > 1 ? {
			index: 0,
			placeholders,
		} : null;
		
		return {
			session,
			edit,
			endCursor,
		};
	},
	
	nextTabstop(session) {
		let {index, placeholders} = session;
		
		while (index < placeholders.length - 1) {
			index++;
			
			let placeholder = session.placeholders[index];
			
			if (placeholder.type === "tabstop" && placeholder.selection) {
				return {
					placeholder,
					session: index < placeholders.length - 1 ? {index, placeholders} : null,
				};
			}
		}
		
		return null;
	},
	
	edit(snippetSession, edits) {
		let {index, placeholders} = snippetSession;
		
		placeholders = placeholders.map(function(placeholder, i) {
			let {selection} = placeholder;
			
			for (let edit of edits) {
				let {
					selection: oldSelection,
					string,
					newSelection,
				} = edit;
				
				if (Selection.isBefore(oldSelection, selection)) {
					selection = Selection.adjustForEarlierEdit(selection, oldSelection, newSelection);
				} else if (Selection.equals(selection, oldSelection)) {
					selection = newSelection;
				} else if (i === index && string === "" && Cursor.equals(oldSelection.start, selection.end)) {
					selection = Selection.expand(selection, newSelection);
				} else if (Selection.isWithin(oldSelection, selection)) {
					selection = Selection.adjustForEditWithinSelection(selection, oldSelection, newSelection);
				} else if (Selection.isOverlapping(selection, oldSelection)) {
					selection = null;
				}
			}
			
			return {
				...placeholder,
				selection,
			};
		});
		
		return {
			index,
			placeholders,
		};
	},
};

module.exports = api;
