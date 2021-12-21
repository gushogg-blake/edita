let os = require("os");
let path = require("path");
let dev = require("electron-is-dev");
let {hideBin} = require("yargs/helpers");
let yargs = require("yargs/yargs");

let args = yargs(hideBin(process.argv));

args.boolean("forceNewInstance");

args.default({
	userDataDir: path.join(os.homedir(), dev ? ".treefrog-dev" : ".treefrog"),
	forceNewInstance: process.env.EDITOR_NEW_INSTANCE === "1",
});

let {
	userDataDir,
	forceNewInstance,
} = args.argv;

module.exports = {
	dev,
	userDataDir,
	forceNewInstance,
};
