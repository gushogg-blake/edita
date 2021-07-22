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
	};
	
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
		},
		
		expandOrContractSelectionDown({document, selection, selectionEndCol}) {
			editor.setSelection(Selection.expandOrContractDown(document.lines, selection, selectionEndCol));
		},
		
		expandOrContractSelectionLeft({document, selection}) {
			editor.setSelection(Selection.expandOrContractLeft(document.lines, selection));
			editor.updateSelectionEndCol();
		},
		
		expandOrContractSelectionRight({document, selection}) {
			editor.setSelection(Selection.expandOrContractRight(document.lines, selection));
			editor.updateSelectionEndCol();
		},
		
		expandOrContractSelectionPageUp({document, selection, selectionEndCol}) {
			let {rows} = editor.getCodeAreaSize();
			
			editor.setSelection(Selection.expandOrContractPageUp(document.lines, rows, selection, selectionEndCol));
		},
		
		expandOrContractSelectionPageDown({document, selection, selectionEndCol}) {
			let {rows} = editor.getCodeAreaSize();
			
			editor.setSelection(Selection.expandOrContractPageDown(document.lines, rows, selection, selectionEndCol));
		},
		
		expandOrContractSelectionEnd({document, selection}) {
			editor.setSelection(Selection.expandOrContractEnd(document.lines, selection));
			editor.updateSelectionEndCol();
		},
		
		expandOrContractSelectionHome({document, selection}) {
			editor.setSelection(Selection.expandOrContractHome(document.lines, selection));
			editor.updateSelectionEndCol();
		},
		
		enter({document, selection, setSelection, applyAndAddHistoryEntry}) {
			let {
				edit,
				newSelection,
			} = document.insertNewline(selection);
			
			applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
			
			clearBatchState();
		},
		
		enterNoAutoIndent({document, selection, setSelection, applyAndAddHistoryEntry}) {
			
		},
		
		/*
		NOTE backspace and delete are identical except for backspace/delete
		*/
		
		backspace({document, selection}) {
			let {
				lastHistoryEntry,
				applyEdit,
				applyAndAddHistoryEntry,
				setSelection,
			} = editor;
			
			let newBatchState = Selection.isFull(selection) ? null : "backspace";
			let result = document.backspace(selection);
			
			if (result) {
				let {
					edit,
					newSelection,
				} = result;
				
				let apply = {
					edits: [edit],
					normalSelection: newSelection,
				};
				
				if (batchState === "backspace") {
					applyEdit(apply);
					
					lastHistoryEntry.redo = apply;
				} else {
					applyAndAddHistoryEntry(apply);
				}
			}
			
			return {
				batchState: newBatchState,
			};
		},
		
		delete({document, selection}) {
			let {
				lastHistoryEntry,
				applyEdit,
				applyAndAddHistoryEntry,
				setSelection,
			} = editor;
			
			let newBatchState = Selection.isFull(selection) ? null : "delete";
			let result = document.delete(selection);
			
			if (result) {
				let {
					edit,
					newSelection,
				} = result;
				
				let apply = {
					edits: [edit],
					normalSelection: newSelection,
				};
				
				if (batchState === "delete") {
					applyEdit(apply);
					
					lastHistoryEntry.redo = apply;
				} else {
					applyAndAddHistoryEntry(apply);
				}
			}
			
			return {
				batchState: newBatchState,
			};
		},
		
		tab({document, selection, setSelection, applyAndAddHistoryEntry}) {
			// TODO snippets, indent/dedent selection
			
			let {
				edit,
				newSelection,
			} = document.replaceSelection(selection, document.fileDetails.indentation.string);
			
			applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
			
			clearBatchState();
		},
		
		shiftTab({document, selection, setSelection, applyAndAddHistoryEntry}) {
			// TODO
		},
		
		async cut({document, selection, setSelection, applyAndAddHistoryEntry}) {
			// TODO line if not full selection?
			if (!Selection.isFull(selection)) {
				return;
			}
			
			await clipboard.write(document.getSelectedText(selection));
			
			let {
				edit,
				newSelection,
			} = document.replaceSelection(selection, "");
			
			applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
			
			clearBatchState();
		},
		
		async copy({document, selection}) {
			// TODO line if not full selection?
			if (!Selection.isFull(selection)) {
				return;
			}
			
			await clipboard.write(document.getSelectedText(selection));
		},
		
		async paste({document, selection, setSelection, applyAndAddHistoryEntry}) {
			let {
				edit,
				newSelection,
			} = document.replaceSelection(selection, await clipboard.read());
			
			applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
			
			clearBatchState();
		},
		
		default(e, keyCombo, isModified, {document, selection}) {
			let handled = false;
			let newBatchState = null;
			
			if (!isModified && e.key.length === 1) {
				e.preventDefault();
				
				let {
					lastHistoryEntry,
					applyEdit,
					applyAndAddHistoryEntry,
					setSelection,
				} = editor;
				
				let {
					edit,
					newSelection,
				} = document.insertCharacter(selection, e.key);
				
				let apply = {
					edits: [edit],
					normalSelection: newSelection,
				};
				
				if (batchState === "typing") {
					applyEdit(apply);
					
					lastHistoryEntry.redo = apply;
				} else {
					applyAndAddHistoryEntry(apply);
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
			
			console.time("redraw");
			editor.redraw();
			console.timeEnd("redraw");
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
