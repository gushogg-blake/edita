let {on, off} = require("./domEvents");

module.exports = function(offsets, handler) {
	let top;
	let right;
	let bottom;
	let left;
	
	function updateOffsets(e) {
		let {
			clientX: x,
			clientY: y,
		} = e;
		
		top = Math.max(0, offsets.top - y);
		right = Math.max(0, offsets.right - (window.innerWidth - x));
		bottom = Math.max(0, offsets.bottom - (window.innerHeight - y));
		left = Math.max(0, offsets.left - x);
	}
	
	function tick() {
		if (
			top > 0
			|| right > 0
			|| bottom > 0
			|| left > 0
		) {
			let x = left > 0 ? -left: right;
			let y = top > 0 ? -top : bottom;
			
			handler(x, y);
		}
	}
	
	function mousemove(e) {
		updateOffsets(e);
		tick();
	}
	
	function mouseup(e) {
		off(window, "mousemove", mousemove);
		off(window, "mouseup", mouseup);
	}
	
	on(window, "mousemove", mousemove);
	on(window, "mouseup", mouseup);
}
