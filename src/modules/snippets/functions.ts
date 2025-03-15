let convertCase = require("utils/convertCase");

module.exports = {
	...convertCase,
	
	quote(str) {
		return "'" + str + "'";
	},
};
