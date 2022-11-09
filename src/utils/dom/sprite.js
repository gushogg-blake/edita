let sprites = {};

module.exports = function(name, width, height, init) {
	if (name in sprites) {
		return sprites[name];
	}
	
	let canvas = document.createElement(canvas);
	
	canvas.width = width;
	canvas.height = height;
	
	init(canvas.getContext("2d"));
	
	sprites[name] = canvas;
	
	return canvas;
}
