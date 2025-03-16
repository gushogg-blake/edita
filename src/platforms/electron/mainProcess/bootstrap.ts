import os from "node:os";
import path from "node:path";
import child_process from "node:child_process";
import yargs from "yargs";

/*
parsing args is complicated once inside electron so we
parse them here and pass them in as base64-encoded JSON.
*/

let {
	NODE_ENV,
	DEBUG_ENDPOINT,
	NODE_ONLY, // no window
} = process.env;

let dev = NODE_ENV === "development";

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

let rootDir = process.cwd();
let buildDir = rootDir + "/build/" + (dev ? "electron-dev" : "electron");

let config = {
	cwd,
	files: argv._,
	dev,
	userDataDir,
	buildDir,
	rootDir,
	forceNewInstance,
	debugEndpoint: DEBUG_ENDPOINT || null,
	nodeOnly: NODE_ONLY === "1",
};

child_process.spawn("npx", [
	"electron",
	buildDir + "/mainProcess/main.js",
	dev && "--inspect",
	"--edita-config=" + Buffer.from(JSON.stringify(config)).toString("base64"),
].filter(Boolean), {
	stdio: "inherit",
});
