let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let stringToLineTuples = require("modules/utils/stringToLineTuples");
let lineTuplesToStrings = require("modules/utils/lineTuplesToStrings");
let createPositions = require("modules/snippets/createPositions");

let {s} = Selection;
let {c} = Cursor;

/*
placeholder - a long-lived object (while the session is active) describing
the placeholder.  not updated to reflect edits

position - object describing a placeholder and its current selection within
the document.  discarded and re-created with updated selections to reflect
edits.  new positions still point to the same underlying placeholders
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

function getContextFromPositions(document, positions) {
	let context = {};
	
	for (let position of positions) {
		let {placeholder} = position;
		
		if (placeholder.type === "tabstop") {
			context[placeholder.name] = getCurrentValue(document, position);
		}
	}
	
	return context;
}

function getCurrentValue(document, position) {
	return document.getSelectedText(position.selection);
}

function sessionFromPositions(positions) {
	return positions.length > 0 ? {
		index: 0,
		positions,
	} : null;
}

let api = {
	insert(editor, document, selection, snippet, replaceWord)  {
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
		
		let {end: endCursor} = document.getSelectionContainingString(editSelection.start, replacedString);
		
		let insertEdit = document.edit(editSelection, replacedString);
		
		editor.applyAndAddHistoryEntry({
			edits: [insertEdit],
			normalSelection: positions.length > 0 ? positions[0].selection : s(endCursor),
			snippetSession: sessionFromPositions(positions),
		});
		
		if (positions.length > 0) {
			let defaultValueEdits;
			
			({
				positions,
				edits: defaultValueEdits,
			} = api.setDefaultValues(document, positions));
			
			if (defaultValueEdits.length > 0) {
				editor.applyAndMergeWithLastHistoryEntry({
					edits: defaultValueEdits,
					normalSelection: positions[0].selection,
					snippetSession: sessionFromPositions(positions),
				});
			}
			
			let computeExpressionEdits;
			
			({
				positions,
				edits: computeExpressionEdits,
			} = api.computeExpressions(document, positions));
			
			if (computeExpressionEdits.length > 0) {
				editor.applyAndMergeWithLastHistoryEntry({
					edits: computeExpressionEdits,
					normalSelection: positions[0].selection,
					snippetSession: sessionFromPositions(positions),
				});
			}
		}
	},
	
	setDefaultValues(document, positions) {
		positions = positions.map(position => ({...position}));
		
		let edits = [];
		
		let context = getContextFromPositions(document, positions);
		
		for (let i = 0; i < positions.length; i++) {
			let position = positions[i];
			let value = getDefaultValue(position.placeholder, context);
			
			if (value !== "") { // we know the current text is "" as all positions start off empty
				let edit = document.edit(position.selection, value);
				
				position.selection = edit.newSelection;
				
				edits.push(edit);
				
				for (let j = i + 1; j < positions.length; j++) {
					let laterPosition = positions[j];
					
					laterPosition.selection = Selection.adjustForEarlierEdit(laterPosition.selection, edit.selection, edit.newSelection);
				}
			}
		}
		
		return {
			positions,
			edits,
		};
	},
	
	computeExpressions(document, positions) {
		positions = positions.map(position => ({...position}));
		
		let edits = [];
		
		let context = getContextFromPositions(document, positions);
		
		for (let i = 0; i < positions.length; i++) {
			let position = positions[i];
			
			if (position.type !== "expression") {
				continue;
			}
			
			let value = position.placeholder.fn(context);
			
			if (value !== getCurrentValue(document, position)) {
				let edit = document.edit(position.selection, value);
				
				position.selection = edit.newSelection;
				
				edits.push(edit);
				
				for (let j = i + 1; j < positions.length; j++) {
					let laterPosition = positions[j];
					
					laterPosition.selection = Selection.adjustForEarlierEdit(laterPosition.selection, edit.selection, edit.newSelection);
				}
			}
		}
		
		return {
			positions,
			edits,
		};
	},
	
	createPositionsForLines(lines, baseLineIndex, newline) {
		let str = lines.join(newline);
		
		let {
			replacedString,
			positions,
		} = createPositions(str, baseLineIndex);
		
		return {
			replacedLines: replacedString.split(newline),
			positions,
		};
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
