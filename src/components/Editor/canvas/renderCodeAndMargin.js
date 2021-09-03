module.exports = function(layers, view) {
	let {
		font,
		tabWidth,
		marginBackground,
		lineNumberColor,
	} = platform.prefs;
	
	let {
		wrappedLines,
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
		startLineIndex,
		firstRowIndex,
	} = view.getLinesToRender();
	
	let leftEdge = marginOffset - scrollPosition.x;
	
	let x = leftEdge;
	let y = rowHeight + topMargin; // not 0 -- we're using textBaseline="bottom"
	
	let lineIndex = startLineIndex;
	
	for (let {line, renderCommands} of lines) {
		let wrappedLine = wrappedLines[lineIndex];
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
				if (row >= firstRowIndex) {
					layers.code.fillText(str, x, y);
				}
				
				offset += string.length;
			}
			
			x += width * colWidth;
		}
		
		rowsRendered++;
		x = leftEdge;
		y += rowHeight;
		for (let i = 0; i < wrappedLine.height; i++) {
			if (i < lineRowIndex) {
				continue;
			}
			
			if (i > 0) {
				x += line.indentCols * colWidth;
			}
			
		}	
		
		lineIndex++;
	}
			
			
		}
		
		// margin background
		// rendered after code so that it covers it if code is scrolled horizontally
		
		let marginHeight = wrappedLine.height * rowHeight;
		
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
		
		// TODO folding
		
	}
}
