let os = require("os");
let path = require("path");
let fsExtra = require("fs-extra");
let glob = require("glob");
let mkdirp = require("mkdirp");
let chokidar = require("chokidar");
let minimatch = require("minimatch-browser");
let fileIsBinary = require("vendor/fileIsBinary");
let fs = require("common/fs");
let createWalk = require("modules/walk");

module.exports = fs({
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
