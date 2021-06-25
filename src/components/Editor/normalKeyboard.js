let getKeyCombo = require("../../utils/getKeyCombo");
let clipboard = require("../../modules/ipc/clipboard/renderer");
let Selection = require("../../modules/utils/Selection");

module.exports = function(editor) {
	let keymap = {
		"ArrowUp": "up",
		"ArrowDown": "down",
		"ArrowLeft": "left",
		"ArrowRight": "right",
		"PageUp": "pageUp",
		"PageDown": "pageDown",
		"End": "end",
		"Home": "home",
		"Shift+ArrowUp": "expandOrContractSelectionUp",
		"Shift+ArrowDown": "expandOrContractSelectionDown",
		"Shift+ArrowLeft": "expandOrContractSelectionLeft",
		"Shift+ArrowRight": "expandOrContractSelectionRight",
		"Shift+PageUp": "expandOrContractSelectionPageUp",
		"Shift+PageDown": "expandOrContractSelectionPageDown",
		"Shift+End": "expandOrContractSelectionEnd",
		"Shift+Home": "expandOrContractSelectionHome",
		"Backspace": "backspace",
		"Delete": "delete",
		"Enter": "enter",
		"Tab": "tab",
		"Shift+Backspace": "backspace",
		"Shift+Delete": "delete",
		"Shift+Enter": "enter",
		"Ctrl+Enter": "enterNoAutoIndent",
		"Shift+Tab": "shiftTab",
		"Ctrl+X": "cut",
		"Ctrl+C": "copy",
		"Ctrl+V": "paste",
		"Ctrl+Z": "undo",
		"Ctrl+Y": "redo",
	};
	
	function setClipboardSelection() { // TODO can this be moved to Editor with if isFull?
		let {
			document,
			selection,
		} = editor;
		
		clipboard.writeSelection(document.getSelectedText(selection));
	}
	
	let batchState = null;
	
	let functions = {
		up({document, selection, selectionEndCol}) {
			editor.setSelection(Selection.up(document.lines, selection, selectionEndCol));
		},
		
		down({document, selection, selectionEndCol}) {
			editor.setSelection(Selection.down(document.lines, selection, selectionEndCol));
		},
		
		left({document, selection}) {
			editor.setSelection(Selection.left(document.lines, selection));
			editor.updateSelectionEndCol();
		},
		
		right({document, selection}) {
			editor.setSelection(Selection.right(document.lines, selection));
			editor.updateSelectionEndCol();
		},
		
		pageUp({document, selection, selectionEndCol}) {
			let {rows} = editor.getCodeAreaSize();
			
			editor.setSelection(Selection.pageUp(document.lines, rows, selection, selectionEndCol));
		},
		
		pageDown({document, selection, selectionEndCol}) {
			let {rows} = editor.getCodeAreaSize();
			
			editor.setSelection(Selection.pageDown(document.lines, rows, selection, selectionEndCol));
		},
		
		end({document, selection}) {
			editor.setSelection(Selection.end(document.lines, selection));
			
			editor.updateSelectionEndCol();
		},
		
		home({document, selection}) {
			editor.setSelection(Selection.home(document.lines, selection));
			
			editor.updateSelectionEndCol();
		},
		
		expandOrContractSelectionUp({document, selection, selectionEndCol}) {
			editor.setSelection(Selection.expandOrContractUp(document.lines, selection, selectionEndCol));
			setClipboardSelection();
		},
		
		expandOrContractSelectionDown({document, selection, selectionEndCol}) {
			editor.setSelection(Selection.expandOrContractDown(document.lines, selection, selectionEndCol));
			setClipboardSelection();
		},
		
		expandOrContractSelectionLeft({document, selection}) {
			editor.setSelection(Selection.expandOrContractLeft(document.lines, selection));
			editor.updateSelectionEndCol();
			setClipboardSelection();
		},
		
		expandOrContractSelectionRight({document, selection}) {
			editor.setSelection(Selection.expandOrContractRight(document.lines, selection));
			editor.updateSelectionEndCol();
			setClipboardSelection();
		},
		
		expandOrContractSelectionPageUp({document, selection, selectionEndCol}) {
			let {rows} = editor.getCodeAreaSize();
			
			editor.setSelection(Selection.expandOrContractPageUp(document.lines, rows, selection, selectionEndCol));
			setClipboardSelection();
		},
		
		expandOrContractSelectionPageDown({document, selection, selectionEndCol}) {
			let {rows} = editor.getCodeAreaSize();
			
			editor.setSelection(Selection.expandOrContractPageDown(document.lines, rows, selection, selectionEndCol));
		},
		
		expandOrContractSelectionEnd({document, selection}) {
			editor.setSelection(Selection.expandOrContractEnd(document.lines, selection));
			editor.updateSelectionEndCol();
			setClipboardSelection();
		},
		
		expandOrContractSelectionHome({document, selection}) {
			editor.setSelection(Selection.expandOrContractHome(document.lines, selection));
			editor.updateSelectionEndCol();
			setClipboardSelection();
		},
		
		enter({document, selection, setSelection, addHistoryEntry}) {
			let {
				lineIndex,
				insertedLines,
				removedLines,
				newSelection,
			} = document.insertNewline(selection);
			
			editor.setSelection(newSelection);
			
			addHistoryEntry({
				undo() {
					document.edit(lineIndex, insertedLines.length, removedLines);
					setSelection(selection);
				},
				
				redo() {
					document.edit(lineIndex, removedLines.length, insertedLines);
					setSelection(newSelection);
				},
			});
		},
		
		enterNoAutoIndent({document, selection, setSelection, addHistoryEntry}) {
			//let {
			//	lineIndex,
			//	insertedLines,
			//	removedLines,
			//	newSelection,
			//} = document.insertNewlineNoAutoIndent(selection);
			//
			//editor.setSelection(newSelection);
			//
			//addHistoryEntry({
			//	undo() {
			//		document.edit(lineIndex, insertedLines.length, removedLines);
			//		setSelection(selection);
			//	},
			//	
			//	redo() {
			//		document.edit(lineIndex, removedLines.length, insertedLines);
			//		setSelection(newSelection);
			//	},
			//});
		},
		
		/*
		NOTE backspace and delete are identical except for backspace/delete
		*/
		
		backspace({document, selection}) {
			let newBatchState = Selection.isFull(selection) ? null : "backspace";
			
			let {
				lastHistoryEntry,
				addHistoryEntry,
				setSelection,
			} = editor;
			
			let result = document.backspace(selection);
			
			if (result === null) {
				return;
			}
			
			let {
				lineIndex,
				insertedLines,
				removedLines,
				newSelection,
			} = result;
			
			setSelection(newSelection, batchState === "backspace");
			
			let redo = function() {
				document.edit(lineIndex, removedLines.length, insertedLines);
				setSelection(newSelection);
			}
			
			if (batchState === "backspace") {
				lastHistoryEntry.redo = redo;
			} else {
				addHistoryEntry({
					undo() {
						document.edit(lineIndex, insertedLines.length, removedLines);
						setSelection(selection);
					},
					
					redo,
				});
			}
			
			if (!Selection.isFull(selection)) {
				newBatchState = "backspace";
			}
			
			return {
				batchState: newBatchState,
			};
		},
		
		delete({document, selection}) {
			let newBatchState = Selection.isFull(selection) ? null : "delete";
			
			let {
				lastHistoryEntry,
				addHistoryEntry,
				setSelection,
			} = editor;
			
			let result = document.delete(selection);
			
			if (result === null) {
				return;
			}
			
			let {
				lineIndex,
				insertedLines,
				removedLines,
				newSelection,
			} = result;
			
			setSelection(newSelection, batchState === "delete");
			
			let redo = function() {
				document.edit(lineIndex, removedLines.length, insertedLines);
				setSelection(newSelection);
			}
			
			if (batchState === "delete") {
				lastHistoryEntry.redo = redo;
			} else {
				addHistoryEntry({
					undo() {
						document.edit(lineIndex, insertedLines.length, removedLines);
						setSelection(selection);
					},
					
					redo,
				});
			}
			
			if (!Selection.isFull(selection)) {
				newBatchState = "delete";
			}
			
			return {
				batchState: newBatchState,
			};
		},
		
		tab({document, selection, setSelection, addHistoryEntry}) {
			// TODO snippets, indent/dedent selection, history
			
			let {
				lineIndex,
				insertedLines,
				removedLines,
				newSelection,
			} = document.replaceSelection(selection, document.fileDetails.indentation.string);
			
			editor.setSelection(newSelection);
		},
		
		shiftTab({document, selection, setSelection, addHistoryEntry}) {
			// TODO
		},
		
		async cut({document, selection, setSelection, addHistoryEntry}) {
			if (!Selection.isFull(selection)) {
				return;
			}
			
			await clipboard.write(document.getSelectedText(selection));
			
			let {
				lineIndex,
				insertedLines,
				removedLines,
				newSelection,
			} = document.replaceSelection(selection, "");
			
			setSelection(newSelection);
			
			addHistoryEntry({
				undo() {
					document.edit(lineIndex, insertedLines.length, removedLines);
					setSelection(selection);
				},
				
				redo() {
					document.edit(lineIndex, removedLines.length, insertedLines);
					setSelection(newSelection);
				},
			});
		},
		
		async copy({document, selection}) {
			// TODO line if not full selection?
			if (!Selection.isFull(selection)) {
				return;
			}
			
			await clipboard.write(document.getSelectedText(selection));
		},
		
		async paste({document, selection, setSelection, addHistoryEntry}) {
			let {
				lineIndex,
				insertedLines,
				removedLines,
				newSelection,
			} = document.replaceSelection(selection, await clipboard.read());
			
			setSelection(newSelection);
			
			addHistoryEntry({
				undo() {
					document.edit(lineIndex, insertedLines.length, removedLines);
					setSelection(selection);
				},
				
				redo() {
					document.edit(lineIndex, removedLines.length, insertedLines);
					setSelection(newSelection);
				},
			});
		},
		
		undo() {
			editor.undo();
		},
		
		redo() {
			editor.redo();
		},
		
		default(e, keyCombo, isModified, {document, selection}) {
			let handled = false;
			let newBatchState = null;
			
			if (!isModified && e.key.length === 1) {
				e.preventDefault();
				
				let {
					lastHistoryEntry,
					addHistoryEntry,
					setSelection,
				} = editor;
				
				let {
					lineIndex,
					removedLines,
					insertedLines,
					newSelection,
				} = document.insertCharacter(selection, e.key);
				
				setSelection(newSelection, batchState === "typing");
				
				let redo = function() {
					document.edit(lineIndex, removedLines.length, insertedLines);
					setSelection(newSelection);
				}
				
				if (batchState === "typing") {
					lastHistoryEntry.redo = redo;
				} else {
					addHistoryEntry({
						undo() {
							document.edit(lineIndex, insertedLines.length, removedLines);
							setSelection(selection);
						},
						
						redo,
					});
				}
				
				if (!Selection.isFull(selection)) {
					newBatchState = "typing";
				}
	
				handled = true;
			}
			
			return {
				handled,
				batchState: newBatchState,
			};
		},
	};
	
	async function keydown(e) {
		let handled = false;
		let {keyCombo, isModified} = getKeyCombo(e);
		
		if (keymap[keyCombo]) {
			e.preventDefault();
			
			({
				batchState = null,
			} = await functions[keymap[keyCombo]](editor) || {});
			
			handled = true;
		} else if (functions.default) {
			({
				handled,
				batchState,
			} = functions.default(e, keyCombo, isModified, editor));
		}
		
		if (handled) {
			editor.updateSelectionEndCol();
			editor.ensureSelectionIsOnScreen();
			editor.updateScrollbars();
			editor.startCursorBlink();
			editor.redraw();
		}
	}
	
	function clearBatchState() {
		batchState = null;
	}
	
	return {
		keydown,
		clearBatchState,
	};
}
