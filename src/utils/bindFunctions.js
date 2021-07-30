module.exports = function(obj, fns) {
	let res = {};
	
	for (let [n, fn] of Object.entries(fns)) {
		res[n] = fn.bind(obj);
	}
	
	return res;
}
