let os = require("os");
let path = require("path");
let getArgs = require("./utils/getArgs");

let dev = process.env.ELECTRON_IS_DEV !== "0";
let args = getArgs(process.argv);

args.boolean("forceNewInstance");

args.default({
	userDataDir: path.join(os.homedir(), dev ? ".edita-dev" : ".edita"),
	forceNewInstance: process.env.EDITOR_NEW_INSTANCE === "1",
});

let {argv} = args;

let {
	userDataDir,
	forceNewInstance,
} = argv;

module.exports = {
	args: argv,
	dev,
	userDataDir,
	forceNewInstance,
};
