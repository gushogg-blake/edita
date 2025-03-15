export default function(a, b) {
	let xDiff = b.pageX - a.pageX;
	let yDiff = b.pageY - a.pageY;
	
	return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}
