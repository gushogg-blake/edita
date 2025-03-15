module.exports = function(obj, fn) {
	for (let k in obj) {
		obj[k] = fn(obj[k], k);
	}
}
