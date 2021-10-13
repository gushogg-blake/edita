module.exports = function(layers, view, rows) {
	let {
		font,
		marginBackground,
		lineNumberColor,
	} = platform.prefs;
	
	let {
		scrollPosition,
		measurements,
	} = view;
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	let {
		marginWidth,
		marginOffset,
		topMargin,
		marginStyle,
	} = view.sizes;
	
	let context = layers.code;
	
	context.font = font;
	context.fillStyle = "black";
	
	let initialColourHint = view.findInitialColourHint();
	
	if (initialColourHint) {
		let {lang, node} = initialColourHint;
		
		context.fillStyle = platform.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
	}
	
	let leftEdge = marginOffset - scrollPosition.x;
	
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let y = rowHeight + topMargin + rowOffset; // rowHeight added as using textBaseline="bottom"
	
	for (let {wrapIndent, renderCommands} of rows) {
		let x = leftEdge + wrapIndent * colWidth;
		let offset = 0;
		
		for (let command of renderCommands) {
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
				offset += string.length;
			}
		}
		
		y += rowHeight;
	}
}
