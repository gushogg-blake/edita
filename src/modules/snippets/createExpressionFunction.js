module.exports = function(code) {
	return new Function("util", "context", `
		with (util) {
			with (context) {
				return ${code};
			}
		}
	`);
}
