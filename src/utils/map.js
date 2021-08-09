module.exports = function(obj, fn) {
	let result = {};
	
	for (let k in obj) {
		result[k] = fn(obj[k], k);
	}
	
	return result;
}
