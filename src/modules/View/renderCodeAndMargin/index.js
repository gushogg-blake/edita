let Renderer = require("./Renderer");

module.exports = function(view, canvas) {
	let renderer = new Renderer(view, canvas);
	
	renderer.render();
}
