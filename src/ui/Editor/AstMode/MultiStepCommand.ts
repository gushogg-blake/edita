import Evented from "utils/Evented";
import AstSelection, {a} from "core/AstSelection";

class MultiStepCommand extends Evented {
	constructor(editor, astManipulation) {
		super();
		
		this.editor = editor;
		this.astManipulation = astManipulation;
		
		this.selectionOnReturnToAstMode = null;
		this.peekingAstMode = this.editor.modeSwitchKey.isPeeking;
		
		this.teardownCallbacks = [
			editor.astMode.on("pasteFromNormalMode", this.onPasteFromNormalMode.bind(this)),
		];
	}
	
	start() {
		let {editor, astManipulation} = this;
		let {document, view, astSelection} = editor;
		let {startLineIndex, endLineIndex} = astSelection;
		
		if (astManipulation.setNormalModeSelection) {
			let normalSelection = astManipulation.setNormalModeSelection(document, astSelection);
			
			editor.switchToNormalMode();
			editor.setNormalSelection(normalSelection);
			
			this.complete();
			
			return;
		}
		
		let indentStr = document.format.indentation.string;
		let {indentLevel: baseIndentLevel} = document.lines[astSelection.startLineIndex];
		
		let astManipulationResult = astManipulation.apply(this, document, astSelection);
		
		this.astManipulationResult = astManipulationResult;
		
		let indentedLines = AstSelection.selectionLinesToStrings(astManipulationResult.replaceSelectionWith, indentStr, baseIndentLevel);
		
		let {
			replacedLines,
			positions,
		} = editor.createSnippetPositionsForLines(indentedLines, startLineIndex);
		
		let edit = document.lineEdit(startLineIndex, endLineIndex - startLineIndex, replacedLines);
		let newSelection = a(startLineIndex, startLineIndex + replacedLines.length);
		
		let snippetSession = null;
		
		let normalSelection;
		
		if (positions.length > 0) {
			if (!this.peekingAstMode) {
				this.selectionOnReturnToAstMode = newSelection;
			}
			
			newSelection = undefined;
			normalSelection = positions[0].selection;
			
			editor.switchToNormalMode();
			
			if (positions.length > 1) {
				snippetSession = {
					index: 0,
					positions,
				};
			}
		}
		
		editor.applyAndAddHistoryEntry({
			edits: [edit],
			astSelection: newSelection,
			normalSelection,
			snippetSession,
		});
		
		if (positions.length === 0) {
			this.complete();
		}
	}
	
	returnFromNormalMode() {
		let {editor} = this;
		
		editor.setAstSelection(this.selectionOnReturnToAstMode);
		editor.switchToAstMode();
		
		this.complete();
	}
	
	get isPeekingAstMode() {
		return this.peekingAstMode;
	}
	
	setSelectionOnReturnToAstMode(astSelection) {
		this.selectionOnReturnToAstMode = astSelection;
	}
	
	setClipboard() {
		this.editor.astMode.setClipboard();
	}
	
	onPasteFromNormalMode(paste) {
		if (this.astManipulationResult.onPasteFromNormalMode) {
			this.astManipulationResult.onPasteFromNormalMode(paste);
		}
	}
	
	complete() {
		this.teardown();
		
		this.fire("complete");
	}
	
	cancel() {
		this.teardown();
		
		this.fire("canceled");
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

export default MultiStepCommand;
