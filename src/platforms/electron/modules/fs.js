let path = require("path");
let fsExtra = require("fs-extra");
let minimatch = require("minimatch");
let glob = require("glob");
let mkdirp = require("mkdirp");
let chokidar = require("chokidar");
let fileIsBinary = require("vendor/fileIsBinary");
let fs = require("modules/fs");

module.exports = fs({
	fs: fsExtra,
	path,
	minimatch,
	glob,
	mkdirp,
	fileIsBinary,
	
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
