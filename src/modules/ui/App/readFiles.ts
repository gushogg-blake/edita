import bluebird from "bluebird";
import {URL, File} from "modules/core";

export default async function(paths) {
	let permissionsErrors = [];
	let binaryFiles = [];
	let otherErrors = false;
	
	let files = await bluebird.map(paths, async function(path) {
		try {
			return await File.read(URL.file(path));
		} catch (e) {
			if (e instanceof platform.fs.FileIsBinary) {
				binaryFiles.push(path);
			} else if (e.code === "EACCES") {
				permissionsErrors.push(path);
			} else {
				console.log("Error reading file " + path);
				console.error(e);
				
				otherErrors = true;
			}
			
			return null;
		}
	}).filter(Boolean);
	
	if (permissionsErrors.length > 0) {
		alert("Could not read the following files (permission denied):\n\n" + permissionsErrors.join("\n"));
	}
	
	if (binaryFiles.length > 0) {
		alert("Opening binary files not supported:\n\n" + binaryFiles.join("\n"));
	}
	
	if (otherErrors) {
		alert("Error occurred while opening files - see console for more details");
	}
	
	return files;
}
