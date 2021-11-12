module.exports = function(array, fn) {
	return [...array.filter(fn), ...array.filter((...args) => !fn(...args))];
}
