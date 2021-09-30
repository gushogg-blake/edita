let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let stringToLineTuples = require("modules/utils/stringToLineTuples");
let lineTuplesToStrings = require("modules/utils/lineTuplesToStrings");
let createPositions = require("modules/snippets/createPositions");
let createPositionsForLines = require("modules/snippets/createPositionsForLines");

let {s} = Selection;
let {c} = Cursor;

/*
placeholder - a long-lived object (while the session is active) describing
the placeholder.  not updated to reflect edits

position - object describing a placeholder and its current selection and
value within the whole document.  discarded and re-created with updated
selections to reflect edits.  new positions still point to the same underlying
placeholders
*/

function getDefaultValue(placeholder, context) {
	let {type} = placeholder;
	
	if (type === "tabstop") {
		return placeholder.getDefaultValue(context);
	} else if (type === "expression") {
		return placeholder.getValue(context);
	} else if (type === "atLiteral") {
		return "@";
	}
}

function getContextFromPositions(positions) {
	let context = {};
	
	for (let position of positions) {
		let {placeholder} = position;
		
		if (placeholder.type === "tabstop") {
			context[placeholder.name] = position.value;
		}
	}
	
	return context;
}

let api = {
	insert(document, selection, snippet, replaceWord)  {
		let {start} = selection;
		let {lineIndex, offset} = start;
		let {indentLevel} = document.lines[lineIndex];
		let indentStr = document.fileDetails.indentation.string;
		let lineTuples = stringToLineTuples(snippet.text);
		let lineStrings = lineTuplesToStrings(lineTuples, indentStr, indentLevel, true);
		let indentedSnippetText = lineStrings.join(document.fileDetails.newline);
		
		let editSelection = (
			replaceWord
			? s(c(lineIndex, offset - replaceWord.length), start)
			: selection
		);
		
		let {
			replacedString,
			positions,
		} = createPositions(indentedSnippetText, editSelection.start.lineIndex, editSelection.start.offset);
		
		// TODO default values (inc at literals) and initial computations
		
		/*
		
		*/
		
		let {end: endCursor} = document.getSelectionContainingString(editSelection.start, replacedString);
		let edit = document.edit(editSelection, replacedString);
		
		let session = {
			index: 0,
			positions,
		};
		
		return {
			session,
			edit,
			endCursor,
		};
	},
	
	createPositionsForLines(lines, baseLineIndex) {
		return createPositionsForLines(lines, baseLineIndex);
	},
	
	nextTabstop(session) {
		let {index, positions} = session;
		
		while (index < positions.length - 1) {
			index++;
			
			let position = positions[index];
			let {placeholder, selection} = position;
			
			if (placeholder.type === "tabstop" && selection) {
				return {
					position,
					session: index < positions.length - 1 ? {index, positions} : null,
				};
			}
		}
		
		return null;
	},
	
	edit(snippetSession, edits) {
		let {index, positions} = snippetSession;
		
		positions = positions.map(function(position, i) {
			let {selection} = position;
			
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
				...position,
				selection,
			};
		});
		
		return {
			index,
			positions,
		};
	},
};

module.exports = api;
