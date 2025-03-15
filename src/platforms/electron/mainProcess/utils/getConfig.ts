import os from "os";
import path from "path";
import yargs from "yargs";

export default function(argv) {
	let config = {
		dev: false,
		files: [],
		userDataDir: path.join(os.homedir(), ".edita"),
		cwd: process.cwd(),
		forceNewInstance: false,
	};
	
	let args = yargs(argv);
	
	args.string("editaConfig");
	
	let {editaConfig} = args.argv;
	
	if (editaConfig) {
		let json = Buffer.from(editaConfig, "base64");
		
		config = JSON.parse(json);
	}
	
	return config;
}
