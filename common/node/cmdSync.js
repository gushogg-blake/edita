let child_process = require("child_process");

function cmd(c) {
	return child_process.execSync(c).toString();
}

module.exports = cmd;
