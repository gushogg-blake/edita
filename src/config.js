let os = require("os");
let {app} = require("electron");
let {hideBin} = require("yargs/helpers");
let yargs = require("yargs/yargs");
let fs = require("flowfs");

let args = yargs(hideBin(process.argv));

args.boolean("watch");

args.default({
	watch: false,
	userDataDir: fs(os.homedir(), ".editor").path,
});

let {
	watch,
	userDataDir,
} = args.argv;

module.exports = {
	watch,
	userDataDir,
};
