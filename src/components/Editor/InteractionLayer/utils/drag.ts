let threshold = 2;

export default function(callbacks) {
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
			
			callbacks.start(e);
		}
		
		if (dragging) {
			callbacks.move(e, x, y);
		}
	}
	
	function mouseup(e) {
		if (mouseIsDown) {
			if (dragging) {
				callbacks.end(e);
			} else {
				callbacks.click(e);
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
