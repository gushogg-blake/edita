module.exports = function(regions, x, y) {
	for (let [left, top, width, height] of regions) {
		let bottom = top + height;
		let right = left + width;
		
		if (x >= left && x < right && y >= top && y < bottom) {
			return true;
		}
	}
	
	return false;
}
