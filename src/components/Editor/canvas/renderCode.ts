export default function(layers, view, offsets) {
	let {
		sizes: {width, marginWidth},
		measurements: {colWidth, rowHeight},
	} = view;
	
	let {
		fontFamily,
		fontSize,
		defaultStyle,
	} = base.theme.editor;
	
	let context = layers.code;
	
	let x;
	let y = offsets.rowOffset + rowHeight; // rowHeight added as using textBaseline="bottom"
	
	let underline = false;
	
	let styleKey = null;
	
	function setStyle(style) {
		let {
			color,
			fontWeight = "normal",
			fontStyle = "normal",
			textDecoration = "none",
		} = style;
		
		//styleKey = color + "_" + fontWeight + "_" + fontStyle + "_" + textDecoration;
		
		context.font = [fontStyle, fontWeight, fontSize, fontFamily].join(" ");
		context.fillStyle = color;
		
		underline = textDecoration === "underline";
	}
	
	function drawUnderline(cols) {
		context.fillRect(x, y - 1, cols * colWidth, 1);
	}
	
	return {
		init() {
			setStyle(defaultStyle);
		},
		
		setStyle(style) {
			setStyle(style);
		},
		
		startRow(wrapIndentCols) {
			x = offsets.leftEdge + wrapIndentCols * colWidth;
		},
		
		endRow() {
			y += rowHeight;
		},
		
		drawTab(width) {
			if (underline) {
				drawUnderline(width);
			}
			
			x += width * colWidth;
		},
		
		drawText(string) {
			let offToLeft = Math.max(0, marginWidth - x);
			let charsOffToLeft = Math.min(string.length, Math.floor(offToLeft / colWidth));
			let maxLength = Math.ceil(width / colWidth);
			let trimmed = string.substr(charsOffToLeft);
			
			x += charsOffToLeft * colWidth;
			
			let str = trimmed.substr(0, maxLength);
			
			if (underline) {
				drawUnderline(str.length);
			}
			
			context.fillText(str, x, y);
			
			x += trimmed.length * colWidth;
		},
		
		skipText(string) {
			x += string.length * colWidth;
		},
	};
}
