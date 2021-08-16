module.exports = function(context, view) {
	let {
		font,
		tabWidth,
		marginBackground,
		lineNumberColor,
	} = base.prefs;
	
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
	
	context.font = font;
	context.fillStyle = "black";
	
	let rowsToRender = height / rowHeight;
	let rowsRendered = 0;
	
	let leftEdge = marginOffset - scrollPosition.x;
	
	let x = leftEdge;
	let y = rowHeight + topMargin; // not 0 -- we're using textBaseline="bottom"
	
	let {
		lineIndex: firstLineIndex,
		lineRowIndex,
	} = view.findFirstVisibleLine();
	
	// find the previous colour hint, if any (otherwise e.g. multiline comments
	// won't be coloured as comments if the opener is not on screen)
	
	findPreviousColourHint: for (let i = firstLineIndex - 1; i >= 0; i--) {
		let wrappedLine = wrappedLines[i];
		let {line, rows} = wrappedLine;
		
		for (let lineRow of [...rows.reverse()]) {
			let commands = [...view.generateRenderCommandsForLine(line, lineRow)].reverse();
			
			for (let command of commands) {
				let {type} = command;
				
				if (type === "colour") {
					let {lang, node} = command;
					
					context.fillStyle = base.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
					
					break findPreviousColourHint;
				}
				
				if (type === "node") {
					break findPreviousColourHint;
				}
			}
		}
	}
	
	let lineIndex = firstLineIndex;
	let offset = 0;
	
	while (true) {
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		
		// code
		
		for (let i = 0; i < wrappedLine.height; i++) {
			let lineRow = wrappedLine.rows[i];
			
			if (i > 0) {
				x += line.indentCols * colWidth;
			}
			
			for (let command of view.generateRenderCommandsForLine(line, lineRow)) {
				let {type} = command;
				
				if (type === "colour") {
					let {lang, node} = command;
					
					context.fillStyle = base.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
				} else if (type === "string") {
					let {string: str} = command;
					
					context.fillText(str, x, y);
					
					x += str.length * colWidth;
					offset += str.length;
				} else if (type === "node") {
					let {lang, node, offset: hintOffset} = command;
					let str = node.text;
					
					/*
					NOTE hint offsets don't always start at the current offset -
					see generateRenderCommandsForLine
					*/
					
					if (hintOffset < offset) {
						let diff = hintOffset - offset;
						
						x += diff * colWidth;
						offset += diff;
						
						context.clearRect(x, y - rowHeight, -diff * colWidth, rowHeight);
					}
					
					context.fillStyle = base.prefs.langs[lang.code].colors[lang.getHiliteClass(node)];
					context.fillText(str, x, y);
					
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
		
		offset = 0;
		
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
