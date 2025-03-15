let os = require("os");
let path = require("path");
let fsExtra = require("fs-extra");
let minimatch = require("minimatch-browser");
let glob = require("glob");
let mkdirp = require("mkdirp");

let fs = require("../fs");

module.exports = fs({
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
