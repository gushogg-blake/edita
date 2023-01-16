/*
split an array at the point that the condition stops being true
*/

module.exports = function(array, fn) {
	let index = array.length;
	
	for (let i = 0; i < array.length; i++) {
		if (!fn(array[i])) {
			index = i;
			
			break;
		}
	}
	
	return [array.slice(0, index), array.slice(index)];
}
