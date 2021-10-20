module.exports = function(url) {
	let {protocol, path} = url;
	
	return {
		file: {
			read() {
				return platform.fs(path).read();
			},
			
			write(code) {
				return platform.save(path, code);
			},
			
			delete() {
				return platform.fs(path).delete();
			},
		},
	}[protocol];
}
