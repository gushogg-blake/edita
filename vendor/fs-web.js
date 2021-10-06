let bluebird = require("bluebird");
let path = require("vendor/path-browser");

class DirectoryEntry {
	constructor(fullPath, type) {
		this.path = fullPath;
		this.name = path.basename(fullPath);
		this.dir = path.dirname(fullPath);
		this.type = type;
	}
}

function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint16Array(buf));
}

let DB_NAME = window.location.host + "_filesystem";
let OS_NAME = "files";
let DIR_IDX = "dir";

function init(callback) {
	let req = window.indexedDB.open(DB_NAME, 1);
	
	req.onupgradeneeded = function(e) {
		let db = e.target.result;
		let objectStore = db.createObjectStore(OS_NAME, {keyPath: "path"});
		
		objectStore.createIndex(DIR_IDX, "dir", {unique: false});
	};
	
	req.onsuccess = function(e) {
		callback(e.target.result);
	};
}

function initOS(type, callback) {
	init(function(db) {
		let trans = db.transaction([OS_NAME], type);
		let os = trans.objectStore(OS_NAME);
		
		callback(os);
	});
}

function readEntry(fullPath) {
	return new Promise(function(resolve, reject) {
		initOS("readonly", function(os) {
			let req = os.get(fullPath);
			
			req.onerror = reject;
			
			req.onsuccess = function(e) {
				let res = e.target.result;
				
				if (res) {
					resolve(res);
				} else {
					reject("File not found");
				}
			};
		});
	});
}

function readFile(fileName) {
	return readEntry(fileName).then(function(entry) {
		let {data} = entry;
		
		if (data instanceof ArrayBuffer) {
			data = ab2str(data);
		}
		
		return data;
	});
}

function writeFile(fileName, data) {
	return new Promise(function(resolve, reject) {
		initOS("readwrite", function(os) {
			let req = os.put({
				"path": fileName,
				"dir": path.dirname(fileName),
				"type": "file",
				"data": data,
			});
			
			req.onerror = reject;
			
			req.onsuccess = function(e) {
				resolve();
			};
		});
	});
}

function removeFile(fileName) {
	return new Promise(function(resolve) {
		initOS("readwrite", function(os) {
			let req = os.delete(fileName);
			
			req.onerror = req.onsuccess = function(e) {
				resolve();
			};
		});
	});
}

function withTrailingSlash(path) {
	return path[path.length - 1] === "/" ? path : path + "/";
}

function readdirEntries(directoryName) {
	return new Promise(function(resolve, reject) {
		initOS("readonly", function(os) {
			let dir = path.dirname(withTrailingSlash(directoryName));
			
			let idx = os.index(DIR_IDX);
			let range = IDBKeyRange.only(dir);
			let req = idx.openCursor(range);
			
			req.onerror = function(e) {
				reject(e);
			};
			
			let results = [];
			
			req.onsuccess = function(e) {
				let cursor = e.target.result;
				
				if (cursor) {
					let value = cursor.value;
					let entry = new DirectoryEntry(value.path, value.type);
					
					results.push(entry);
					
					cursor.continue();
				} else {
					resolve(results);
				}
			};
		});
	});
}

function readdir(directoryName) {
	return bluebird.map(readdirEntries(directoryName), e => e.path);
}

function mkdir(fullPath) {
	return new Promise(function(resolve, reject) {
		initOS("readwrite", function(os) {
			let dir = withTrailingSlash(path);
			
			let req = os.put({
				"path": fullPath,
				"dir": path.dirname(dir),
				"type": "directory"
			});
			
			req.onerror = reject;
			
			req.onsuccess = function(e) {
				resolve();
			};
		});
	});
}

function rmdir(fullPath) {
	return readdirEntries(fullPath).then(function removeFiles(files) {
		if (!files || files.length === 0) {
			return removeFile(fullPath);
		}
		
		let file = files.shift();
		let func = file.type === "directory" ? rmdir : removeFile;
		
		return func(file.name).then(function() {
			return removeFiles(files);
		});
	});
}

async function stat(fullPath) {
	let entry = await readEntry(fullPath);
	
	return {
		isFile() {
			return entry.type === "file";
		},
		
		isDirectory() {
			return entry.type === "directory";
		},
	};
}

async function rename(oldPath, newPath) {
	let data = await readFile(oldPath);
	
	await removeFile(oldPath);
	await writeFile(newPath, data);
}

async function copy(src, dest) {
	await writeFile(dest, await readFile(src));
}

async function exists(fullPath) {
	try {
		await readEntry(fullPath);
		
		return true;
	} catch (e) {
		return false;
	}
}

module.exports = {
	readFile,
	writeFile,
	remove: removeFile,
	unlink: removeFile,
	readdir,
	mkdir,
	rmdir,
};
