import os from "node:os";
import path from "node:path";
import fsExtra from "fs-extra";
import minimatch from "minimatch-browser";
import {glob} from "glob";
import {mkdirp} from "mkdirp";

import fs from "../fs";

export default fs({
	fs: fsExtra,
	glob,
	mkdirp,
	minimatch,
	path,
	homeDir: os.homedir(),
	
	cwd() {
		return process.cwd();
	},
	
	watch(path, handler) {
		let watcher = chokidar.watch(path, {
			ignoreInitial: true,
			depth: 0,
		});
		
		watcher.on("all", function(type, path) {
			handler(type, path);
		});
		
		return function() {
			watcher.close();
		}
	},
});
