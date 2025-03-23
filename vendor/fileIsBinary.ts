let fs = require("node:fs");
let {promisify} = require("node:util");

let openAsync = promisify(fs.open);
let closeAsync = promisify(fs.close);

let MAX_BYTES = 512;

function bufferIsBinary(fileBuffer, bytesRead) {
	// empty file. no clue what it is.
	if (bytesRead === 0) {
		return false;
	}
	
	let suspiciousBytes = 0;
	let totalBytes = Math.min(bytesRead, MAX_BYTES);
	
	// UTF-8 BOM
	if (bytesRead >= 3 && fileBuffer[0] === 0xef && fileBuffer[1] === 0xbb && fileBuffer[2] === 0xbf) {
		return false;
	}
	
	// UTF-32 BOM
	if (
		bytesRead >= 4 &&
		fileBuffer[0] === 0x00 &&
		fileBuffer[1] === 0x00 &&
		fileBuffer[2] === 0xfe &&
		fileBuffer[3] === 0xff
	) {
		return false;
	}
	
	// UTF-32 LE BOM
	if (
		bytesRead >= 4 &&
		fileBuffer[0] === 0xff &&
		fileBuffer[1] === 0xfe &&
		fileBuffer[2] === 0x00 &&
		fileBuffer[3] === 0x00
	) {
		return false;
	}
	
	// GB BOM
	if (
		bytesRead >= 4 &&
		fileBuffer[0] === 0x84 &&
		fileBuffer[1] === 0x31 &&
		fileBuffer[2] === 0x95 &&
		fileBuffer[3] === 0x33
	) {
		return false;
	}
	
	if (totalBytes >= 5 && fileBuffer.slice(0, 5).toString() === "%PDF-") {
		return true;
	}
	
	// UTF-16 BE BOM
	if (bytesRead >= 2 && fileBuffer[0] === 0xfe && fileBuffer[1] === 0xff) {
		return false;
	}
	
	// UTF-16 LE BOM
	if (bytesRead >= 2 && fileBuffer[0] === 0xff && fileBuffer[1] === 0xfe) {
		return false;
	}
	
	for (let i = 0; i < totalBytes; i++) {
		if (fileBuffer[i] === 0) {
			// NULL byte--it's binary!
			return true;
		} else if ((fileBuffer[i] < 7 || fileBuffer[i] > 14) && (fileBuffer[i] < 32 || fileBuffer[i] > 127)) {
			// UTF-8 detection
			if (fileBuffer[i] > 193 && fileBuffer[i] < 224 && i + 1 < totalBytes) {
				i++;
				if (fileBuffer[i] > 127 && fileBuffer[i] < 192) {
					continue;
				}
			} else if (fileBuffer[i] > 223 && fileBuffer[i] < 240 && i + 2 < totalBytes) {
				i++;
				if (fileBuffer[i] > 127 && fileBuffer[i] < 192 && fileBuffer[i + 1] > 127 && fileBuffer[i + 1] < 192) {
					i++;
					continue;
				}
			}
			
			suspiciousBytes++;
			// Read at least 32 fileBuffer before making a decision
			if (i > 32 && (suspiciousBytes * 100) / totalBytes > 10) {
				return true;
			}
		}
	}
	
	if ((suspiciousBytes * 100) / totalBytes > 10) {
		return true;
	}
	
	return false;
}

export default async function(path) {
	let fileDescriptor = await openAsync(path, "r");
	let allocBuffer = Buffer.alloc(MAX_BYTES);
	
	// Read the file with no encoding for raw buffer access.
	return new Promise((fulfill, reject) => {
		fs.read(fileDescriptor, allocBuffer, 0, MAX_BYTES, 0, (err, bytesRead, _) => {
			closeAsync(fileDescriptor);
			
			if (err) {
				reject(err);
			} else {
				fulfill(bufferIsBinary(allocBuffer, bytesRead));
			}
		});
	});
}
