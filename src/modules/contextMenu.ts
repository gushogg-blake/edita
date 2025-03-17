import {mount, unmount} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import {on, off} from "utils/dom/domEvents";
import screenOffsets from "utils/dom/screenOffsets";

/*
RUNS: once, to display a synthetic (non-native) context menu

WHY: electron can display native context menus but sometimes we want them
to be un-cancelable (if we're holding Esc and don't want the repeat to
close the menu); web can't display native ones so needs a custom solution
*/

export default function(app, items, coords, options={}) {
	options = {
		noCancel: false,
		...options,
	};
	
	if (items.length === 0) {
		return;
	}
	
	let {x, y} = coords;
	
	let overlay = document.createElement("div");
	let container = document.createElement("div");
	
	app.renderDiv(overlay);
	
	overlay.appendChild(container);
	
	container.tabIndex = "1";
	
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
		userSelect: "none",
	});
	
	let contextMenu = mount(base.components.ContextMenu, {
		target: container,
		
		props: {
			items,
			
			onclick(item) {
				click(item);
			},
		},
	});
	
	let {activeElement: previousActiveElement} = document;
	
	setTimeout(function() {
		container.focus();
	}, 0);
	
	function click(item) {
		item.onClick();
		
		close();
	}
	
	function close() {
		unmount(contextMenu);
		
		overlay.parentNode.removeChild(overlay);
		
		setTimeout(function() {
			previousActiveElement.focus();
		}, 0);
		
		off(overlay, "mousedown", close);
		off(window, "blur", close);
		off(container, "keydown", keydown);
	}
	
	function keydown(e) {
		e.preventDefault();
		
		if (e.key === "Escape" && !options.noCancel) {
			close();
			
			return;
		}
		
		for (let item of items) {
			if (item.label.toLowerCase().indexOf("%" + e.key.toLowerCase()) !== -1) {
				click(item);
				
				return;
			}
		}
	}
	
	let {right, bottom} = screenOffsets(container);
	
	if (right < 0) {
		container.style.left = (x - -right) + "px";
	}
	
	if (bottom < 0) {
		container.style.top = (y - -bottom) + "px";
	}
	
	on(container, "mousedown", function(e) {
		e.stopPropagation();
	});
	
	on(overlay, "mousedown", close);
	on(window, "blur", close);
	on(container, "keydown", keydown);
}
