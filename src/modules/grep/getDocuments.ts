import bluebird from "bluebird";
import {FileLikeURL, Document} from "core";

export default async function(paths) {
	return bluebird.map(paths, async function(path) {
		try {
			let code = await platform.fs(path).read();
			
			// MIGRATE
			return new Document(code, FileLikeURL.file(path), {
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
