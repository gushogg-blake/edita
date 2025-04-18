export function on(el, e, handler, opts?) {
	for (let event of e.split(" ")) {
		el.addEventListener(event, handler, opts);
	}
	
	return function() {
		off(el, e, handler);
	}
}

export function off(el, e, handler) {
	for (let event of e.split(" ")) {
		el.removeEventListener(event, handler);
	}
}
