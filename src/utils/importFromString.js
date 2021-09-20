module.exports = function(code) {
	return import("data:text/javascript;charset=utf-8," + encodeURIComponent(code));
}
