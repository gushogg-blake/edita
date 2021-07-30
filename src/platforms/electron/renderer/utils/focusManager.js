/*
focus/blur - focusable components should call focus with a blur function

they then become the focused element and the previous blur function, if any, is called

(native behaviour is too eager to blur elements - we only want to blur things
when something else is focused, e.g. clicking the editor should blur the find bar
but clicking a random div shouldn't)

blur functions must uniquely and consistently identify the component instance, e.g.
with let blur = function() { ... } at the top level.
*/

module.exports = function() {
	let blurCurrentElement = null;
	
	return {
		focus(blur) {
			if (blurCurrentElement && blurCurrentElement !== blur) {
				blurCurrentElement();
			}
			
			if (blur) {
				blurCurrentElement = blur;
			} else {
				blurCurrentElement = null;
			}
		},
		
		teardown(blur) {
			if (blurCurrentElement === blur) {
				blurCurrentElement = null;
			}
		},
	}
}
