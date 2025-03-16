import os from "os";
import path from "path";
import fsExtra from "fs-extra";
import {glob} from "glob";
import {mkdirp} from "mkdirp";
import chokidar from "chokidar";
import minimatch from "minimatch-browser";
import fileIsBinary from "vendor/fileIsBinary";
import fs from "utils/fs";
import createWalk from "modules/walk";

export default fs({
	fs: fsExtra,
	path,
	glob,
	mkdirp,
	fileIsBinary,
	minimatch,
	homeDir: os.homedir(),
	
	walk: createWalk({
		fs: fsExtra,
		path,
	}),
	
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
