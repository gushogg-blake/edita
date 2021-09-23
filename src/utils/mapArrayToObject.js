module.exports = function(array, fn) {
	let result = {};
	
	for (let item of array) {
		let [key, value] = fn(item);
		
		result[key] = value;
	}
	
	return result;
}
