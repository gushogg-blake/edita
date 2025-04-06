import {a} from "core";
import type {Document, Selection} from "core";
import type {MultiStepCommand} from "core/astMode";

export default {
	wrap: {
		code: "wrap",
		name: "Wrap",
		
		apply(multiStepCommand: MultiStepCommand, document: Document, selection: Selection) {
			multiStepCommand.setClipboard();
			
			return {
				replaceSelectionWith: [{indent: 0, string: "@_"}],
				
				onPasteFromNormalMode(paste) {
					let {astSelection, insertLines, edit} = paste;
					let {startLineIndex} = astSelection;
					
					if (!multiStepCommand.isPeekingAstMode) {
						multiStepCommand.setSelectionOnReturnToAstMode(a(startLineIndex, startLineIndex + insertLines.length));
					}
				},
			};
		},
	},
};
