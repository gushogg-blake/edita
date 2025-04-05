import {AstSelection, a} from "core";

export default {
	wrap: {
		code: "wrap",
		name: "Wrap",
		
		apply(multiStepCommand, document, selection) {
			multiStepCommand.setClipboard();
			
			return {
				replaceSelectionWith: [[0, "@_"]],
				
				onPasteFromNormalMode(paste) {
					let {astSelection, insertLines, edit} = paste;
					let {startLineIndex} = astSelection;
					
					if (!multiStepCommand.isPeekingAstMode) {
						multiStepCommand.setSelectionOnReturnToAstMode(AstSelection.s(startLineIndex, startLineIndex + insertLines.length));
					}
				},
			};
		},
	},
};
