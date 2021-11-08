module.exports = {
	foldZoom(wheelCombo) {
		let foldIndentAdjustment = wheelCombo.dir === "up" ? 1 : -1;
		
		let {document, view} = this;
		let {folds} = view;
		let foldHeaders = Object.keys(folds).map(Number);
		
		let maxIndent = document.lines.reduce((max, line) => Math.max(max, line.indentLevel), 0);
		let minFoldIndent = Math.min(...foldHeaders.map(lineIndex => document.lines[lineIndex].indentLevel));
		
		minFoldIndent = Math.min(minFoldIndent, maxIndent + 1);
		
		let newFoldIndent = minFoldIndent + foldIndentAdjustment;
		
		newFoldIndent = Math.min(newFoldIndent, maxIndent + 1);
		newFoldIndent = Math.max(1, newFoldIndent);
		
		console.log(newFoldIndent);
		
		folds = {};
		
		for (let lineIndex = 0; lineIndex < document.lines.length; lineIndex++) {
			let line = document.lines[lineIndex];
			
			if (line.indentLevel === newFoldIndent) {
				folds[lineIndex] = lineIndex + 1;
				
				let foldedLineIndex;
				let foldIndentLevel = line.indentLevel;
				
				for (foldedLineIndex = lineIndex + 1; foldedLineIndex < document.lines.length; foldedLineIndex++) {
					let line = document.lines[foldedLineIndex];
					
					if (line.indentLevel < foldIndentLevel) {
						break;
					}
					
					folds[lineIndex]++;
				}
				
				if (folds[lineIndex] === lineIndex + 1) {
					//delete folds[lineIndex];
				}
				
				lineIndex = foldedLineIndex - 1;
			}
		}
		
		view.setFolds(folds);
	},
};
