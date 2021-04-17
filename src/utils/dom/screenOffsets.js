module.exports = function(el) {
	let {x, y, width, height} = el.getBoundingClientRect();
	
	return {
		x,
		y,
		top: y,
		left: x,
		bottom: window.innerHeight - y - height,
		right: window.innerWidth - x - width,
		width,
		height,
	};
}
