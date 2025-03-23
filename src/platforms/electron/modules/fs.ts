let os = require("node:os");
let path = require("node:path");
let fsExtra = require("fs-extra");
let {glob} = require("glob");
let chokidar = require("chokidar");
let {mkdirp} = require("mkdirp");

import minimatch from "minimatch-browser";
import fileIsBinary from "vendor/fileIsBinary";
import fs from "utils/fs";

export default fs({
	fs: fsExtra,
	path,
	glob,
	mkdirp,
	fileIsBinary,
	minimatch,
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
