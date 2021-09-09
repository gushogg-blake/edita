module.exports = function(path) {
	let {homeDir} = platform.systemInfo;
	
	if (homeDir && (path === homeDir || path.startsWith(homeDir + platform.path.sep))) {
		return "~" + path.substr(homeDir.length);
	}
	
	return path;
}
