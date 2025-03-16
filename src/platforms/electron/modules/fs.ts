let os = require("os");
let path = require("path");
let fsExtra = require("fs-extra");
let {glob} = require("glob");
let {mkdirp} = require("mkdirp");
let chokidar = require("chokidar");

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
