module.exports = function(layers, view) {
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
	
	layers.code.font = font;
	layers.code.fillStyle = "black";
	
	layers.margin.font = font;
	
	let {
		lines,
		firstRowIndex,
	} = view.getLinesToRender();
	
	let leftEdge = marginOffset - scrollPosition.x;
	
	let x = leftEdge;
	let y = rowHeight + topMargin; // not 0 -- we're using textBaseline="bottom"
	
	/*
	wraps - array of wrap offsets and Infinity, e.g. [32, 71, Infinity]
	*/
	
	for (let {line, lineIndex, wraps, renderCommands} of lines) {
		let wrapIndex = 0;
		let row = 0;
		let offset = 0;
		
		for (let command of renderCommands) {
			let {string, node, lang, width} = command;
			
			if (!width) {
				width = string.length;
			}
			
			if (node) {
				layers.code.fillStyle = platform.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
			}
			
			if (string) {
				if (offset + string.length > wraps[wrapIndex]) {
					let split = nextWrap - offset;
					let a = string.substr(0, split);
					let b = string.substr(split);
					
					if (row >= firstRowIndex) {
						layers.code.fillText(a, x, y);
					}
					
					row++;
					y += rowHeight;
					x = leftEdge + line.indentCols * colWidth;
					
					wrapIndex++;
				} else {
					if (row >= firstRowIndex) {
						layers.code.fillText(string, x, y);
					}
					
					x += width * colWidth;
				}
				
				offset += string.length;
			}
		}
		
		x = leftEdge;
		y += rowHeight;
		
		// margin background
		
		let marginHeight = wraps.length * rowHeight;
		
		layers.margin.fillStyle = marginBackground;
		layers.margin.fillRect(0, y - marginHeight - rowHeight, marginWidth, marginHeight);
		
		// line number
		
		let lineNumber = String(lineIndex + 1);
		
		layers.margin.fillStyle = lineNumberColor;
		
		layers.margin.fillText(
			lineNumber,
			marginWidth - marginStyle.paddingRight - lineNumber.length * colWidth,
			y - marginHeight,
		);
	}
}
