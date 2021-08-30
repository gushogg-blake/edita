let path = require("path");
let fsExtra = require("fs-extra");
let minimatch = require("minimatch");
let glob = require("glob");
let fs = require("../../../common/modules/fs");

module.exports = fs({
	fs: fsExtra,
	path,
	minimatch,
	glob,
	
	cwd() {
		return process.cwd();
	},
});
