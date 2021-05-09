let os = require("os");
let config = require("../../../config");

module.exports = {
	getSystemInfo() {
		return {
			newline: os.EOL,
		};
	},
	
	getConfig() {
		return config;
	},
};
