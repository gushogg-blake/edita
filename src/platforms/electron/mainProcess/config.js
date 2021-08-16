let os = require("os");
let path = require("path");
let {hideBin} = require("yargs/helpers");
let yargs = require("yargs/yargs");

let args = yargs(hideBin(process.argv));

args.default({
	userDataDir: path.join(os.homedir(), ".editor"),
});

let {
	userDataDir,
} = args.argv;

module.exports = {
	userDataDir,
};
