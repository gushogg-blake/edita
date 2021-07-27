let os = require("os");
let {hideBin} = require("yargs/helpers");
let yargs = require("yargs/yargs");
let fs = require("flowfs");

let args = yargs(hideBin(process.argv));

args.default({
	userDataDir: fs(os.homedir(), ".editor").path,
});

let {
	userDataDir,
} = args.argv;

module.exports = {
	userDataDir,
};
