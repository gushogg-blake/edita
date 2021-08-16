import inlineStyle from "utils/dom/inlineStyle";
import {on, off} from "utils/dom/domEvents";
import screenOffsets from "utils/dom/screenOffsets";
import ContextMenu from "./ContextMenu.svelte";

export default function(e, items) {
	let x = e.clientX + 3;
	let y = e.clientY;
	
	let overlay = document.createElement("div");
	let container = document.createElement("div");
	
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
	
	let contextMenu = new ContextMenu({
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
}
