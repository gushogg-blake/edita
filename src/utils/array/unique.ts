module.exports = function(array) {
	let result = [];
	
	for (let item of array) {
		if (!result.includes(item)) {
			result.push(item);
		}
	}
	
	return result;
}
