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
		"Escape": "switchToAstMode",
		"Ctrl+X": "cut",
		"Ctrl+C": "copy",
		"Ctrl+V": "paste",
	};
	
	// TODO pass document, selection etc in?  (or pass editor in and detructure)
	
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
		
		switchToAstMode() {
			editor.switchToAstMode();
		},
		
		enter({document, selection}) {
			editor.setSelection(document.insertNewline(selection));
		},
		
		enterNoAutoIndent({document, selection}) {
			//editor.setSelection(document.insertNewlineNoAutoIndent(selection));
		},
		
		backspace({document, selection}) {
			editor.setSelection(document.backspace(selection));
		},
		
		delete({document, selection}) {
			editor.setSelection(document.delete(selection));
		},
		
		tab({document, selection}) {
			// TODO snippets
			// TODO indent/dedent selection
			
			editor.setSelection(document.replaceSelection(selection, document.fileDetails.indentation.string));
		},
		
		shiftTab({document, selection}) {
			// TODO
		},
		
		async cut({document, selection}) {
		},
		
		async copy({document, selection}) {
			// TODO line if not full selection?
			await clipboard.write(document.getSelectedText(selection));
		},
		
		async paste({document, selection}) {
		},
		
		default(e, keyCombo, isModified, {document, selection}) {
			if (!isModified && e.key.length === 1) {
				editor.setSelection(document.insertCharacter(selection, e.key));
			}
		},
	};
	
	function keydown(e) {
		let {keyCombo, isModified} = getKeyCombo(e);
		
		if (keymap[keyCombo]) {
			functions[keymap[keyCombo]](editor);
		} else if (functions.default) {
			functions.default(e, keyCombo, isModified, editor);
		}
		
		editor.updateSelectionEndCol();
		editor.ensureSelectionIsOnScreen();
		editor.updateScrollbars();
		editor.startCursorBlink();
		editor.redraw();
	}
	
	return {
		keydown,
	};
}
