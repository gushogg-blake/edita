module.exports = function(layers, view, style, offsets) {
	let {
		measurements: {colWidth, rowHeight},
	} = view;
	
	let context = layers.hilites;
	
	let y = offsets.rowOffset;
	let col;
	let startCol;
	let inSelection = false;
	
	function draw() {
		let x = offsets.leftEdge + startCol * colWidth;
		let width = (col - startCol) * colWidth;
		
		context.fillRect(x, y, width, rowHeight);
	}
	
	return {
		init() {
			context.fillStyle = style;
		},
		
		startRow(wrapIndentCols) {
			col = wrapIndentCols;
			
			if (inSelection) {
				startCol = col;
			}
		},
		
		endRow(isLastRow) {
			if (inSelection) {
				if (isLastRow) {
					col++;
				}
				
				draw();
			}
			
			y += rowHeight;
		},
		
		advance(cols) {
			col += cols;
		},
		
		enterSelection() {
			startCol = col;
			inSelection = true;
		},
		
		leaveSelection() {
			draw();
			
			inSelection = false;
		},
		
		flush() {
			if (inSelection) {
				draw();
			}
		},
	};
}
