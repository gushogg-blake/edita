import {mount, unmount} from "svelte";
import sleep from "utils/sleep";
import inlineStyle from "utils/dom/inlineStyle";
import {on, off} from "utils/dom/domEvents";
import screenOffsets from "utils/dom/screenOffsets";

/*
RUNS: on right click, to display a synthetic (non-native) context menu

WHY: electron can display native context menus but sometimes we want them
to be un-cancelable (if we're holding Esc and don't want the repeat to
close the menu); web can't display native ones so needs a custom solution

there is also a pref for it, as Chrome moved away from native menus to one
that isn't as smooth.
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
			options,
			
			onclick(item) {
				click(item);
			},
			
			onclose() {
				close();
			},
		},
	});
	
	let {activeElement: previousActiveElement} = document;
	
	setTimeout(function() {
		container.focus();
	}, 0);
	
	async function click(item) {
		close();
		
		/*
		NOTE this seems to be needed to close the menu before
		a confirm() even though close() should have removed the
		overlay synchronously. stepping through the code, it
		works as expected (menu closes first) without the sleep,
		but running normally the menu is still visible while the
		confirm dialog is up
		*/
		
		await sleep(0);
		
		item.onClick();
	}
	
	function close() {
		unmount(contextMenu);
		
		overlay.parentNode.removeChild(overlay);
		
		setTimeout(function() {
			previousActiveElement.focus();
		}, 0);
		
		off(overlay, "mousedown", close);
		off(window, "blur", close);
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
}
