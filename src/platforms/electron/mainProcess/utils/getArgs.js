let {hideBin} = require("yargs/helpers");
let yargs = require("yargs/yargs");

module.exports = function(argv) {
	let start = argv.indexOf("--begin-app-args");
	let end = argv.indexOf("--end-app-args");
	
	if (start !== -1 && end !== -1) {
		argv = argv.slice(start + 1, end);
	}
	
	return yargs(hideBin(argv));
}
