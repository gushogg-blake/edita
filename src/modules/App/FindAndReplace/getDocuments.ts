let bluebird = require("bluebird");
let Document = require("modules/Document");
let URL = require("modules/URL");

export default async function(paths) {
	return bluebird.map(paths, async function(path) {
		try {
			let code = await platform.fs(path).read();
			
			return new Document(code, URL.file(path), {
				noParse: true,
			});
		} catch (e) {
			if (e instanceof platform.fs.FileIsBinary) {
				console.info("Skipping binary file: " + path);
			} else {
				console.error(e);
			}
			
			return null;
		}
	}).filter(Boolean);
}
