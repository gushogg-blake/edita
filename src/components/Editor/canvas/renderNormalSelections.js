module.exports = function(layers, view, style) {
	let {
		sizes: {topMargin, marginWidth, marginOffset},
		measurements: {colWidth, rowHeight},
		scrollPosition,
	} = view;
	
	let context = layers.hilites;
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let y = topMargin + rowOffset;
	let col;
	let startCol;
	let inSelection = false;
	
	function draw() {
		let x = leftEdge + startCol * colWidth;
		let width = col - startCol * colWidth;
		
		context.fillRect(x, y, width, rowHeight);
	}
	
	return {
		init() {
			context.fillStyle = style;
		},
		
		startRow() {
			startCol = 0;
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
