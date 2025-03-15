module.exports = function(url) {
	let {protocol, path} = url;
	
	return {
		file: {
			read() {
				return platform.fs(path).read();
			},
			
			save(code) {
				return platform.fs(path).write(code, {
					mkdirp: true,
				});
			},
			
			delete() {
				return platform.fs(path).delete();
			},
			
			exists() {
				return platform.fs(path).exists();
			},
		},
	}[protocol];
}
