import convertCase from "utils/convertCase";

export default {
	...convertCase,
	
	quote(str) {
		return "'" + str + "'";
	},
};
