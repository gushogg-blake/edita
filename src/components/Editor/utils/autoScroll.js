let autoScroll = require("../../../utils/dom/autoScroll");
let screenOffsets = require("../../../utils/dom/screenOffsets");
let calculateMarginOffset = require("../../../modules/render/calculateMarginOffset");

module.exports = function(
	canvas,
	measurements,
	document,
	hasHorizontalScrollbar,
	scrollBy,
) {
	let offsets = screenOffsets(canvas);
	
	offsets.left += calculateMarginOffset(document.lines, measurements);
	
	autoScroll(offsets, function(x, y) {
		let {colWidth} = measurements;
		
		let xOffset = x === 0 ? 0 : Math.round(Math.max(1, Math.abs(x) / colWidth)) * colWidth;
		let rows = y === 0 ? 0 : Math.round(Math.max(1, Math.pow(2, Math.abs(y) / 30)));
		
		if (!hasHorizontalScrollbar) {
			xOffset = 0;
		}
		
		if (x < 0) {
			xOffset = -xOffset;
		}
		
		if (y < 0) {
			rows = -rows;
		}
		
		scrollBy(xOffset, rows);
	});
}
