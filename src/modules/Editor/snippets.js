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

function getContextFromPositions(document, positions) {
	let context = {};
	
	for (let position of positions) {
		if (isActiveTabstop(position)) {
			context[position.placeholder.name] = getCurrentValue(document, position);
		}
	}
	
	return context;
}

function getCurrentValue(document, position) {
	let {selection} = position;
	
	return selection ? document.getSelectedText(selection) : "";
}

function isActiveTabstop(position) {
	let {selection, placeholder} = position;
	
	return selection && placeholder.type === "tabstop";
}

function sessionFromPositions(positions, tabstops, firstTabstopIndex) {
	return tabstops.length > 0 ? {
		index: firstTabstopIndex,
		positions,
	} : null;
}

function initNormalSelectionFromPositions(positions, tabstops) {
	return tabstops.length > 0 ? tabstops[0].selection : positions.at(-1).selection;
}

let api = {
	insert(editor, snippet, replaceWord)  {
		let {document} = editor;
		let selection = editor.view.Selection.sort();
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
			tabstops,
			firstTabstopIndex,
		} = createPositions(indentedSnippetText, editSelection.start.lineIndex, editSelection.start.offset);
		
		let {end: endCursor} = document.getSelectionContainingString(editSelection.start, replacedString);
		
		let insertEdit = document.edit(editSelection, replacedString);
		
		editor.applyAndAddHistoryEntry({
			edits: [insertEdit],
			normalSelection: initNormalSelectionFromPositions(positions, tabstops),
			snippetSession: sessionFromPositions(positions, tabstops, firstTabstopIndex),
		});
		
		if (positions.length > 1) { // there's always an end marker
			let defaultValueEdits;
			
			({
				positions,
				tabstops,
				firstTabstopIndex,
				edits: defaultValueEdits,
			} = api.setDefaultValues(document, positions));
			
			if (defaultValueEdits.length > 0) {
				editor.applyAndMergeWithLastHistoryEntry({
					edits: defaultValueEdits,
					normalSelection: initNormalSelectionFromPositions(positions, tabstops),
					snippetSession: sessionFromPositions(positions, tabstops, firstTabstopIndex),
				});
			}
			
			let computeExpressionEdits;
			
			({
				positions,
				tabstops,
				firstTabstopIndex,
				edits: computeExpressionEdits,
			} = api.computeExpressions(document, positions));
			
			if (computeExpressionEdits.length > 0) {
				editor.applyAndMergeWithLastHistoryEntry({
					edits: computeExpressionEdits,
					normalSelection: initNormalSelectionFromPositions(positions, tabstops),
					snippetSession: sessionFromPositions(positions, tabstops, firstTabstopIndex),
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
			let value = position.placeholder.getDefaultValue(context);
			
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
			tabstops: positions.filter(isActiveTabstop),
			firstTabstopIndex: positions.findIndex(isActiveTabstop),
			edits,
		};
	},
	
	computeExpressions(document, positions) {
		positions = positions.map(position => ({...position}));
		
		let edits = [];
		
		let context = getContextFromPositions(document, positions);
		
		for (let i = 0; i < positions.length; i++) {
			let position = positions[i];
			let {selection, placeholder} = position;
			
			if (!selection || placeholder.type !== "expression") {
				continue;
			}
			
			let value = placeholder.getValue(context);
			
			if (value !== getCurrentValue(document, position)) {
				let edit = document.edit(position.selection, value);
				
				position.selection = edit.newSelection;
				
				edits.push(edit);
				
				for (let j = i + 1; j < positions.length; j++) {
					let laterPosition = positions[j];
					
					laterPosition.selection = laterPosition.selection && Selection.adjustForEarlierEdit(laterPosition.selection, edit.selection, edit.newSelection);
				}
			}
		}
		
		return {
			positions,
			tabstops: positions.filter(isActiveTabstop),
			firstTabstopIndex: positions.findIndex(isActiveTabstop),
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
			let {selection, placeholder} = position;
			
			if (selection && placeholder.type === "tabstop") {
				return {
					position,
					session: {index, positions},
				};
			}
		}
		
		return null;
	},
	
	edit(snippetSession, edits) {
		let {index, positions} = snippetSession;
		
		positions = positions.map(function(position, i) {
			let {selection, placeholder} = position;
			
			if (!selection) {
				return position;
			}
			
			for (let edit of edits) {
				let {
					selection: oldSelection,
					string,
					newSelection,
				} = edit;
				
				if (placeholder.type === "expression") {
					if (Selection.isBefore(oldSelection, selection)) {
						if (i > index) {
							selection = Selection.adjustForEarlierEdit(selection, oldSelection, newSelection);
						}
					} else if (Selection.equals(selection, oldSelection) || Selection.isPartiallyOverlapping(selection, oldSelection)) {
						selection = null;
					}
				} else {
					if (placeholder.type === "tabstop" && i === index && string === "" && Cursor.equals(oldSelection.start, selection.end)) {
						selection = Selection.expand(selection, newSelection);
					} else if (Selection.isBefore(oldSelection, selection)) {
						selection = Selection.adjustForEarlierEdit(selection, oldSelection, newSelection);
					} else if (Selection.isWithin(oldSelection, selection)) {
						selection = Selection.adjustForEditWithinSelection(selection, oldSelection, newSelection);
					} else if (Selection.isPartiallyOverlapping(selection, oldSelection)) {
						selection = null;
					}
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
