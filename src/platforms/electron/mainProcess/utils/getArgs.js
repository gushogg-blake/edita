let yargs = require("yargs/yargs");

/*
args may or may not have node/electron at the beginning, and the
first "." could be from "electron ."
*/

module.exports = function(argv) {
	let start = argv.indexOf("--start-args=1");
	
	if (start === -1) {
		throw new Error("--start-args=1 argument required to separate command-line args from node/electron paths");
	}
	
	argv = argv.slice(start + 1);
	
	let dot = argv.indexOf(".");
	
	if (dot !== -1) {
		argv.splice(dot, 1);
	}
	
	return yargs(argv);
}
