module.exports = function(range) {
	let {
		startIndex,
		endIndex,
		selection,
	} = range;
	
	return {
		startIndex,
		endIndex,
		
		startPosition: {
			row: selection.start.lineIndex,
			column: selection.start.offset,
		},
		
		endPosition: {
			row: selection.end.lineIndex,
			column: selection.end.offset,
		},
	};
}
