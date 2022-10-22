let bluebird = require("bluebird");
let Document = require("modules/Document");
let URL = require("modules/URL");
let {FileIsBinary} = require("modules/errors");

module.exports = async function(paths) {
	return bluebird.map(paths, async function(path) {
		try {
			let code = await platform.fs(path).read();
			
			return new Document(code, URL.file(path), {
				noParse: true,
			});
		} catch (e) {
			if (e instanceof FileIsBinary) {
				console.info("Skipping binary file: " + path);
			} else {
				console.error(e);
			}
			
			return null;
		}
	}).filter(Boolean);
}
