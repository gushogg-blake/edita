function findPrevColourHint(wrappedLines, firstLineIndex, lineRowIndex) {
	let wrappedLine = wrappedLines[firstLineIndex];
	
	for (let i = lineRowIndex - 1; i >= 0; i--) {
		let commands = [...wrappedLine.rows[i].renderCommands].reverse();
		
		for (let command of commands) {
			let {type} = command;
			
			if (type === "colour") {
				return command;
			}
			
			if (type === "node") {
				return null;
			}
		}
	}
	
	for (let i = firstLineIndex - 1; i >= 0; i--) {
		let wrappedLine = wrappedLines[i];
		
		for (let lineRow of [...wrappedLine.rows.reverse()]) {
			let commands = [...lineRow.renderCommands].reverse();
			
			for (let command of commands) {
				let {type} = command;
				
				if (type === "colour") {
					return command;
				}
				
				if (type === "node") {
					return null;
				}
			}
		}
	}
	
	return null;
}

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
		document,
		measurements,
	} = view;
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	let {
		width,
		height,
		marginWidth,
		marginOffset,
		topMargin,
		marginStyle,
	} = view.sizes;
	
	layers.code.font = font;
	layers.code.fillStyle = "black";
	
	layers.margin.font = font;
	
	let rowsToRender = height / rowHeight;
	let rowsRendered = 0;
	
	let leftEdge = marginOffset - scrollPosition.x;
	
	let x = leftEdge;
	let y = rowHeight + topMargin; // not 0 -- we're using textBaseline="bottom"
	
	let firstVisibleLine = view.findFirstVisibleLine();
	
	/*
	when switching away from a tab the view will unwrap all lines, so if the last
	line is wrapped and we're scrolled right to the bottom, there will be no
	visible line at first when switching back to the tab.  the next resize will
	re-wrap the lines and rerender.
	*/
	
	if (!firstVisibleLine) {
		return;
	}
	
	let {
		lineIndex: firstLineIndex,
		lineRowIndex,
	} = firstVisibleLine;
	
	// find the previous colour hint, if any (otherwise e.g. multiline comments
	// won't be coloured as comments if the opener is not on screen)
	
	let prevColourHint = findPrevColourHint(wrappedLines, firstLineIndex, lineRowIndex);
	
	if (prevColourHint) {
		let {lang, node} = prevColourHint;
		
		layers.code.fillStyle = platform.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
	}
	
	let lineIndex = firstLineIndex;
	
	while (true) {
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let offset = 0;
		
		// code
		
		for (let i = 0; i < wrappedLine.height; i++) {
			if (i < lineRowIndex) {
				continue;
			}
			
			let lineRow = wrappedLine.rows[i];
			
			if (i > 0) {
				x += line.indentCols * colWidth;
			}
			
			for (let command of lineRow.renderCommands) {
				let {type} = command;
				
				if (type === "colour") {
					let {lang, node} = command;
					
					layers.code.fillStyle = platform.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
				} else if (type === "string") {
					let {string: str} = command;
					
					layers.code.fillText(str, x, y);
					
					x += str.length * colWidth;
					offset += str.length;
				} else if (type === "node") {
					let {lang, node, offset: hintOffset} = command;
					let str = node.text;
					
					layers.code.fillStyle = platform.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
					layers.code.fillText(str, x, y);
					
					x += str.length * colWidth;
					offset += str.length;
				} else if (type === "tab") {
					let {width} = command;
					
					x += width * colWidth;
					offset++;
				}
			}
			
			rowsRendered++;
			x = leftEdge;
			y += rowHeight;
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
		
		if (rowsRendered >= rowsToRender) {
			break;
		}
		
		lineIndex++;
		
		if (lineIndex === wrappedLines.length) {
			break;
		}
	}
}
