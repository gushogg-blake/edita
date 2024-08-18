let os = require("os");
let path = require("path");
let child_process = require("child_process");
let yargs = require("yargs/yargs");
let currentWorkspaceHasWindow = require("./utils/currentWorkspaceHasWindow");

/*
parsing args is complicated once inside electron so we
parse them here and pass them in as base64-encoded JSON.
*/

let dev = process.env.NODE_ENV === "development";

function getArgs(argv) {
	let start = argv.indexOf("--start-args");
	
	if (start !== -1) {
		return argv.slice(start + 1);
	} else {
		console.log("Note: ignoring command-line arguments. Pass --start-args to indicate start of app args");
		
		return [];
	}
}

let args = yargs(getArgs(process.argv));

args.boolean("forceNewInstance");

args.default({
	cwd: os.homedir(),
	userDataDir: path.join(os.homedir(), dev ? ".edita-dev" : ".edita"),
	forceNewInstance: false,
});

let {argv} = args;

let {
	cwd,
	userDataDir,
	forceNewInstance,
} = argv;

let config = {
	cwd,
	files: argv._,
	dev,
	userDataDir,
	forceNewInstance,
	currentWorkspaceHasWindow: currentWorkspaceHasWindow(),
};

child_process.spawn("npx", [
	"electron",
	dev ? "build/electron-dev/mainProcess/main.js" : ".",
	dev && "--inspect",
	"--edita-config=" + Buffer.from(JSON.stringify(config)).toString("base64"),
].filter(Boolean), {
	stdio: "inherit",
});
