module.exports = function(context, view) {
	let {
		font,
		tabWidth,
		marginBackground,
		lineNumberColor,
	} = app.prefs;
	
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
	
	let {
		lang,
	} = document.fileDetails;
	
	context.font = font;
	context.fillStyle = "black";
	
	let {colors} = app.prefs.langs[lang.code] || {colors: {}}; //
	
	let rowsToRender = height / rowHeight;
	let rowsRendered = 0;
	
	let leftEdge = marginOffset - scrollPosition.x;
	
	let x = leftEdge;
	let y = rowHeight + topMargin; // not 0 -- we're using textBaseline="bottom"
	
	let {
		index: firstLineIndex,
		lineRowIndex,
	} = view.findFirstVisibleLine();
	
	// find the previous colour hint, if any (otherwise e.g. multiline comments
	// won't be coloured as comments if the opener is not on screen)
	
	findPreviousColourHint: for (let i = firstLineIndex - 1; i >= 0; i--) {
		let wrappedLine = wrappedLines[i];
		let {line, rows} = wrappedLine;
		
		for (let lineRow of [...rows.reverse()]) {
			let commands = [...view.generateRenderCommandsForLine(line, lineRow)].reverse();
			
			for (let [type, value] of commands) {
				if (type === "colour") {
					let node = value;
					
					context.fillStyle = colors[lang.getHiliteClass(node)];
					
					break findPreviousColourHint;
				}
				
				if (type === "node") {
					break findPreviousColourHint;
				}
			}
		}
	}
	
	let lineIndex = firstLineIndex;
	
	while (true) {
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		
		// code
		
		for (let i = 0; i < wrappedLine.height; i++) {
			let lineRow = wrappedLine.rows[i];
			
			if (i > 0) {
				x += line.indentCols * colWidth;
			}
			
			for (let [type, value] of view.generateRenderCommandsForLine(line, lineRow)) {
				if (type === "colour") {
					let node = value;
					
					context.fillStyle = colors[lang.getHiliteClass(node)];
				}
				
				if (lineIndex === firstLineIndex && i < lineRowIndex) {
					continue;
				}
				
				if (type === "string") {
					let string = value;
					
					context.fillText(string, x, y);
					
					x += string.length * colWidth;
				} else if (type === "node") {
					let node = value;
					let str = node.text;
					
					context.fillStyle = colors[lang.getHiliteClass(node)];
					context.fillText(str, x, y);
					
					x += str.length * colWidth;
				} else if (type === "tab") {
					x += value * colWidth;
				}
			}
			
			rowsRendered++;
			x = leftEdge;
			y += rowHeight;
		}
		
		let {fillStyle} = context;
		
		// margin background
		// rendered after code so that it covers it if code is scrolled horizontally
		
		let marginHeight = wrappedLine.height * rowHeight;
		
		context.fillStyle = marginBackground;
		context.fillRect(0, y - marginHeight - rowHeight, marginWidth, marginHeight);
		
		// line number
		
		let lineNumber = String(lineIndex + 1);
		
		context.fillStyle = lineNumberColor;
		
		context.fillText(
			lineNumber,
			marginWidth - marginStyle.paddingRight - lineNumber.length * colWidth,
			y - marginHeight,
		);
		
		context.fillStyle = fillStyle;
		
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
