import bluebird from "bluebird";

export async function readFileForOpen(path) {
	try {
		throw "migrating";
		return await File.fromPath(path);
		return await platform.fs(path).read();
	} catch (e) {
		if (e instanceof platform.fs.FileIsBinary) {
			alert("Opening binary files not supported: " + path);
		} else if (e.code === "EACCES") {
			alert("Could not read " + path + " (permission denied)");
		} else {
			console.log("Error reading file " + path);
			console.error(e);
			
			alert("Error occurred while opening file: " + path + " - see console for more details");
		}
		
		return null;
	}
}

export async function readFilesForOpen(paths) {
	let permissionsErrors = [];
	let binaryFiles = [];
	let otherErrors = false;
	
	let files = await bluebird.map(paths, async function(path) {
		try {
			return {
				path,
				code: await platform.fs(path).read(),
			};
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
