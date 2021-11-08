module.exports = {
	foldZoom(wheelCombo, cursor) {
		let foldIndentAdjustment = wheelCombo.dir === "up" ? 1 : -1;
		
		let {document, view} = this;
		let {lines} = document;
		let {folds} = view;
		let foldHeaders = Object.keys(folds).map(Number);
		
		/*
		there must be at least two consecutive lines at the same indent
		level for the first line to be able to be a fold header
		*/
		
		function isFoldable(lineIndex) {
			return lines[lineIndex + 1]?.indentLevel >= lines[lineIndex].indentLevel;
		}
		
		let maxFoldableIndent = lines.reduce(function(max, line, i) {
			return isFoldable(i) ? Math.max(max, line.indentLevel) : max;
		}, 0);
		
		let minFoldIndent = Math.min(...foldHeaders.map(lineIndex => lines[lineIndex].indentLevel));
		
		minFoldIndent = Math.min(minFoldIndent, maxFoldableIndent + 1);
		
		let newFoldIndent = minFoldIndent + foldIndentAdjustment;
		
		newFoldIndent = Math.min(newFoldIndent, maxFoldableIndent + 1);
		newFoldIndent = Math.max(1, newFoldIndent);
		
		folds = {};
		
		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			let line = lines[lineIndex];
			
			if (line.indentLevel === newFoldIndent && isFoldable(lineIndex)) {
				folds[lineIndex] = lineIndex + 1;
				
				let foldedLineIndex;
				let foldIndentLevel = line.indentLevel;
				
				for (foldedLineIndex = lineIndex + 1; foldedLineIndex < lines.length; foldedLineIndex++) {
					let line = lines[foldedLineIndex];
					
					if (line.indentLevel < foldIndentLevel) {
						break;
					}
					
					folds[lineIndex]++;
				}
				
				lineIndex = foldedLineIndex - 1;
			}
		}
		
		view.setFolds(folds);
	},
};
