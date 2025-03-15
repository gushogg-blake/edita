import yargs from "yargs/yargs";

/*
remove args inserted by node/npm/electron/chromium/etc for
sane parsing
*/

let filters = [
	function(argv) {
		let start = argv.indexOf("--start-args");
		
		if (start !== -1) {
			return argv.slice(start + 1);
		} else {
			console.log("Note: ignoring command-line arguments. Pass --start-args to indicate start of app args");
			
			return [];
		}
	},
	
	function(argv) {
		let dot = argv.indexOf(".");
		
		if (dot !== -1) {
			argv.splice(dot, 1);
		}
	},
	
	function(argv) {
		return argv.filter(p => p !== "--allow-file-access-from-files");
	},
];

export default function(argv) {
	argv = [...argv];
	
	for (let fn of filters) {
		let result = fn(argv);
		
		if (result !== undefined) {
			argv = result;
		}
	}
	
	return yargs(argv);
}
