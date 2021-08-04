import inlineStyle from "../../utils/dom/inlineStyle";
import {on, off} from "../../utils/dom/domEvents";
import screenOffsets from "../../utils/dom/screenOffsets";
import ContextMenu from "./ContextMenu.svelte";

export default function(e, items) {
	let x = e.clientX + 3;
	let y = e.clientY;
	
	let container = document.createElement("div");
	
	on(container, "mousedown", function(e) {
		e.stopPropagation();
	});
	
	document.body.appendChild(container);
	
	container.style = inlineStyle({
		position: "fixed",
		zIndex: 100,
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
		
		container.parentNode.removeChild(container);
		
		off(document.body, "mousedown", close);
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
	
	on(window, "blur", close);
	
	setTimeout(function() {
		on(document.body, "mousedown", close);
	}, 0);
}
