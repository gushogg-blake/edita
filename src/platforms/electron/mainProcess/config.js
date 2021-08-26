let os = require("os");
let path = require("path");
let dev = require("electron-is-dev");
let {hideBin} = require("yargs/helpers");
let yargs = require("yargs/yargs");

let args = yargs(hideBin(process.argv));

args.boolean("forceNewInstance");

args.default({
	userDataDir: path.join(os.homedir(), dev ? ".editor-dev" : ".editor"),
	forceNewInstance: false,
});

let {
	userDataDir,
	forceNewInstance,
} = args.argv;

forceNewInstance = forceNewInstance || process.env.EDITOR_NEW_INSTANCE;

module.exports = {
	dev,
	userDataDir,
	forceNewInstance,
};
