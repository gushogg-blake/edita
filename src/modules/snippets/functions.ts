let convertCase = require("utils/convertCase");

export default {
	...convertCase,
	
	quote(str) {
		return "'" + str + "'";
	},
};
