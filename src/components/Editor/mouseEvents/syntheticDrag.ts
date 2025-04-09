/*
convert mousedown/mousemove/mouseup into synthetic drag events

we don't handle click events from the DOM directly, so we use a
separate callback for that here (we need fine grained control
over exactly what happens with mousedown, mouseup, etc)
*/

type ClickCallback = (e: MouseEvent) => void;

type Params = {
	onclick: ClickCallback;
};

type Handler = {
	mousedown: (e: MouseEvent) => void;
	mousemove: (e: MouseEvent) => void;
	mouseup: (e: MouseEvent) => void;
};

function createDragEvent(type: string, e: MouseEvent): DragEvent {
	return new DragEvent(type, {
		dataTransfer: new DataTransfer(),
		...e,
	});
}

let threshold = 2;

export default function(el: HTMLElement, params: Params): Handler {
	let mouseIsDown = false;
	let dragging = false;
	let distance = 0;
	
	let origX, origY;
	let x, y;
	
	function mousedown(e) {
		mouseIsDown = true;
		dragging = false;
		distance = 0;
		origX = e.pageX;
		origY = e.pageY;
	}
	
	function mousemove(e) {
		if (!mouseIsDown) {
			return;
		}
		
		distance++;
		
		x = e.pageX - origX;
		y = e.pageY - origY;
		
		if (!dragging && distance > threshold) {
			dragging = true;
			
			el.dispatchEvent(createDragEvent("dragstart", e));
			el.dispatchEvent(createDragEvent("dragenter", e));
		}
		
		if (dragging) {
			el.dispatchEvent(createDragEvent("dragover", e));
		}
	}
	
	function mouseup(e) {
		if (mouseIsDown) {
			if (dragging) {
				if (window.document.elementsFromPoint(e.pageX, e.pageY).includes(el)) {
					el.dispatchEvent(createDragEvent("drop", e));
				}
				
				el.dispatchEvent(createDragEvent("dragend", e));
			} else {
				params.onclick(e);
			}
		}
		
		mouseIsDown = false;
		dragging = false;
	}
	
	return {
		mousedown,
		mousemove,
		mouseup,
	};
}
