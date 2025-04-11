import bluebird from "bluebird";
import {type FileLikeURL, File} from "core";

export default async function(urls: FileLikeURL[], asObject: boolean = false) {
	let permissionsErrors = [];
	let binaryFiles = [];
	let otherErrors = false;
	
	let files = await bluebird.map(urls, async function(url) {
		try {
			return await File.read(url);
		} catch (e) {
			let {path} = url;
			
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
	
	if (asObject) {
		let obj = {};
		
		for (let file of files) {
			obj[file.url] = file;
		}
		
		return obj;
	} else {
		return files;
	}
}
