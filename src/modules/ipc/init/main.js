let os = require("os");

module.exports = {
	getSystemInfo() {
		return {
			newline: os.EOL,
		};
	},
};
