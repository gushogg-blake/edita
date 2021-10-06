let inlineStyle = require("utils/dom/inlineStyle");
let {on, off} = require("utils/dom/domEvents");
let screenOffsets = require("utils/dom/screenOffsets");

module.exports = function(items, coords, noCancel=false) {
	if (items.length === 0) {
		return;
	}
	
	let {x, y} = coords;
	
	let overlay = document.createElement("div");
	let container = document.createElement("div");
	
	overlay.className = "editor";
	
	document.body.appendChild(overlay);
	overlay.appendChild(container);
	
	overlay.style = inlineStyle({
		position: "fixed",
		zIndex: 100,
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	});
	
	container.style = inlineStyle({
		position: "absolute",
		top: y,
		left: x,
		opacity: 0,
		userSelect: "none",
	});
	
	let contextMenu = new base.components.ContextMenu({
		target: container,
		
		props: {
			items,
		},
	});
	
	function close() {
		contextMenu.$destroy();
		
		overlay.parentNode.removeChild(overlay);
		
		off(overlay, "mousedown", close);
		off(window, "blur", close);
		off(window, "keydown", keydown);
	}
	
	function keydown(e) {
		if (e.key === "Escape" && !noCancel) {
			e.preventDefault();
			
			close();
		}
	}
	
	contextMenu.$on("click", function({detail: item}) {
		item.onClick();
		
		close();
	});
	
	let {right, bottom} = screenOffsets(container);
	
	if (right < 0) {
		container.style.left = (x - -right) + "px";
	}
	
	if (bottom < 0) {
		container.style.top = (y - -bottom) + "px";
	}
	
	container.style.opacity = "1";
	
	on(container, "mousedown", function(e) {
		e.stopPropagation();
	});
	
	on(window, "blur", close);
	on(overlay, "mousedown", close);
	on(window, "keydown", keydown);
}
