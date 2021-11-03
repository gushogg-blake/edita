module.exports = function(layers, view) {
	let {
		font,
		marginBackground,
		lineNumberColor,
	} = platform.prefs;
	
	let {
		sizes,
		measurements,
		scrollPosition,
	} = view;
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	let {
		height,
		marginWidth,
		topMargin,
		marginStyle,
	} = sizes;
	
	let context = layers.code;
	
	context.font = font;
	context.fillStyle = "black";
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let x;
	let y = rowHeight + topMargin + rowOffset; // rowHeight added as using textBaseline="bottom"
	
	return {
		initialColourHint(command) {
			let {node, lang} = command;
			
			if (node) {
				context.fillStyle = platform.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
			}
		},
		
		startRow(wrapIndent) {
			x = leftEdge + wrapIndent * colWidth;
		},
		
		endRow() {
			y += rowHeight;
		},
		
		draw(command) {
			let {string, node, lang, width} = command;
			
			if (!width) {
				width = string?.length || 0;
			}
			
			if (node) {
				context.fillStyle = platform.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
			}
			
			if (string) {
				context.fillText(string, x, y);
				
				x += width * colWidth;
			}
		},
	};
}
