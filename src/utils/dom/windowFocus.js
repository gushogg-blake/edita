let {removeInPlace} = require("../arrayMethods");

let isFocused = document.hasFocus();

let handlers = [];

function focus() {
	isFocused = true;
	
	update();
}

function blur() {
	isFocused = false;
	
	update();
}

function update() {
	for (let handler of handlers) {
		handler(isFocused);
	}
}

window.addEventListener("focus", focus);
window.addEventListener("blur", blur);

module.exports = {
	listen(handler, init=true) {
		handlers.push(handler);
		
		if (init) {
			handler(isFocused);
		}
		
		return function() {
			removeInPlace(handlers, handler);
		}
	},
	
	isFocused() {
		return isFocused;
	},
};
