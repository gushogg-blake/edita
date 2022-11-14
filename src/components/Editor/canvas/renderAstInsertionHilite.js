let lineThickness = 2;
let lineWidth = 35;

module.exports = function(layers, view, offsets) {
	let {
		measurements: {rowHeight},
	} = view;
	
	let context = layers.hilites;
	
	let y = offsets.rowOffset;
	
	let startY;
	let endY;
	
	return {
		init() {
			context.fillStyle = base.theme.editor.astInsertionHiliteBackground;
		},
		
		startRow() {
		},
		
		endRow() {
			y += rowHeight;
		},
		
		draw() {
			if (height === 0) {
				context.fillRect(x, y, lineWidth, lineThickness);
			} else {
				let middle = y + Math.round(height / 2) - Math.round(lineThickness / 2);
				
				context.fillRect(x, middle, lineWidth, lineThickness);
				
				context.save();
				
				context.translate(x + lineWidth / 2, y + lineThickness / 2);
				context.rotate(45 * Math.PI / 180);
				context.fillRect(1, 2, 9, 9);
				
				context.restore();
			}
		},
	};
}
