let autoScroll = require("../../../utils/dom/autoScroll");
let screenOffsets = require("../../../utils/dom/screenOffsets");

module.exports = function(
	canvas,
	view,
	showingHorizontalScrollbar,
) {
	let offsets = screenOffsets(canvas);
	
	offsets.left += view.sizes.marginOffset;
	
	autoScroll(offsets, function(x, y) {
		let {colWidth} = measurements;
		
		let xOffset = x === 0 ? 0 : Math.round(Math.max(1, Math.abs(x) / colWidth)) * colWidth;
		let rows = y === 0 ? 0 : Math.round(Math.max(1, Math.pow(1.3, Math.abs(y) / 25)));
		
		if (!showingHorizontalScrollbar) {
			xOffset = 0;
		}
		
		if (x < 0) {
			xOffset = -xOffset;
		}
		
		if (y < 0) {
			rows = -rows;
		}
		
		view.scrollBy(xOffset, rows);
	});
}
