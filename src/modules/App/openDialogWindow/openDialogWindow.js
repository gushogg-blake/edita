let inlineStyle = require("utils/dom/inlineStyle");
let {on, off} = require("utils/dom/domEvents");

module.exports = function(app, createDialogComponent) {
	return async function(dialog, dialogOptions, windowOptions) {
		let container = document.createElement("div");
		let toolbar = document.createElement("div");
		let content = document.createElement("div");
		
		document.body.appendChild(container);
		container.appendChild(toolbar);
		container.appendChild(content);
		
		on(toolbar, "mousedown", function(e) {
			e.preventDefault();
		});
		
		let closed = false;
		
		let close = () => {
			if (closed) {
				return;
			}
			
			container.parentNode.removeChild(container);
			
			this.focusSelectedTabAsync();
			
			closed = true;
		}
		
		let toolbarComponent = new base.components.DialogToolbar({
			target: toolbar,
			
			props: {
				title: windowOptions.title,
			},
		});
		
		toolbarComponent.$on("close", close);
		
		container.className = "editor editor-dialog";
		
		container.style.visibility = "hidden";
		
		let onCancel = await createDialogComponent[dialog](content, dialogOptions, close);
		
		function cancel() {
			close();
			
			if (onCancel) {
				onCancel();
			}
		}
		
		if (!windowOptions.fitContents) {
			let {
				width,
				height,
			} = windowOptions;
			
			inlineStyle.assign(content, {
				width,
				height,
			});
		}
		
		let {
			offsetWidth: width,
			offsetHeight: height,
		} = container;
		
		let x = Math.round(window.innerWidth / 2 - width / 2);
		let y = Math.round(window.innerHeight / 2 - height / 2);
		
		inlineStyle.assign(container, {
			visibility: "visible",
			top: y,
			left: x,
		});
		
		let dragging = false;
		let distance = 0;
		let origMouseCoords;
		let origPosition;
		
		function mousedown(e) {
			e.stopPropagation();
			
			if (e.target.nodeName.toLowerCase() === "button") {
				return;
			}
			
			on(window, "mousemove", mousemove);
			on(window, "mouseup", mouseup);
		}
		
		function mousemove(e) {
			if (!dragging) {
				distance++;
				
				if (distance >= 2) {
					dragging = true;
					
					origMouseCoords = {
						x: e.clientX,
						y: e.clientY,
					};
					
					origPosition = {
						x: container.offsetLeft,
						y: container.offsetTop,
					};
				}
				
				return;
			}
			
			let diff = {
				x: e.clientX - origMouseCoords.x,
				y: e.clientY - origMouseCoords.y,
			};
			
			inlineStyle.assign(container, {
				top: origPosition.y + diff.y,
				left: origPosition.x + diff.x,
			});
		}
		
		function mouseup(e) {
			dragging = false;
			distance = 0;
			
			off(window, "mousemove", mousemove);
			off(window, "mouseup", mouseup);
		}
		
		on(toolbar, "mousedown", mousedown);
		
		on(container, "keydown", function(e) {
			e.stopPropagation();
			
			if (e.key === "Escape") {
				cancel();
			}
		});
	}
}
