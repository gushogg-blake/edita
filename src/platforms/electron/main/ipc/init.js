let os = require("os");
let config = require("../config");

module.exports = {
	init() {
		return {
			config,
			
			systemInfo:{
				newline: os.EOL,
			},
		};
	},
};
