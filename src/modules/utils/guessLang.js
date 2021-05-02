let fs = require("flowfs");
let langs = require("../langs");

module.exports = function(code, path) {
	return langs[fs(path).type] || null;
}
