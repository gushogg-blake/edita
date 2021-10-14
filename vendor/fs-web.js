let bluebird = require("bluebird");
let osPath = require("vendor/path-browser");

class DirectoryEntry {
	constructor(path, type) {
		this.path = path;
		this.name = osPath.basename(path);
		this.dir = osPath.dirname(path);
		this.type = type;
	}
}

function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function withTrailingSlash(path) {
	return path[path.length - 1] === "/" ? path : path + "/";
}

let rootStat = {
	isFile() {
		return false;
	},
	
	isDirectory() {
		return true;
	},
};

module.exports = function(dbName) {
	let OS_NAME = "files";
	let DIR_IDX = "dir";
	
	let watchers = {};
	
	function notifyWatchers(path, type) {
		for (let [watchPath, handlers] of Object.entries(watchers)) {
			if (path === watchPath || path.startsWith(withTrailingSlash(watchPath))) {
				for (let handler of handlers) {
					handler(type, path);
				}
			}
		}
	}
	
	function init(callback) {
		let req = window.indexedDB.open(dbName, 1);
		
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
	
	function readEntry(path) {
		return new Promise(function(resolve, reject) {
			initOS("readonly", function(os) {
				let req = os.get(path);
				
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
	
	function readFile(path) {
		return readEntry(path).then(function(entry) {
			let {data} = entry;
			
			if (data instanceof ArrayBuffer) {
				data = ab2str(data);
			}
			
			return data;
		});
	}
	
	async function writeFile(path, data) {
		let exists = false;
		
		await readFile(path).then(function() {
			exists = true;
		}, () => {});
		
		return new Promise(function(resolve, reject) {
			initOS("readwrite", function(os) {
				let req = os.put({
					"path": path,
					"dir": osPath.dirname(path),
					"type": "file",
					"data": data,
				});
				
				req.onerror = reject;
				
				req.onsuccess = function(e) {
					notifyWatchers(path, exists ? "change" : "new");
					
					resolve();
				};
			});
		});
	}
	
	function removeFile(path) {
		return new Promise(function(resolve) {
			initOS("readwrite", function(os) {
				let req = os.delete(path);
				
				req.onerror = req.onsuccess = function(e) {
					notifyWatchers(path, "delete");
					
					resolve();
				};
			});
		});
	}
	
	function readdirEntries(directoryName) {
		return new Promise(function(resolve, reject) {
			initOS("readonly", function(os) {
				let dir = osPath.dirname(withTrailingSlash(directoryName));
				
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
	
	function mkdir(path) {
		return new Promise(function(resolve, reject) {
			initOS("readwrite", function(os) {
				let dir = withTrailingSlash(path);
				
				let req = os.put({
					"path": path,
					"dir": osPath.dirname(dir),
					"type": "directory"
				});
				
				req.onerror = reject;
				
				req.onsuccess = function(e) {
					notifyWatchers(path, "newDir");
					
					resolve();
				};
			});
		});
	}
	
	function rmdir(path) {
		return readdirEntries(path).then(function removeFiles(files) {
			if (!files || files.length === 0) {
				return removeFile(path);
			}
			
			let file = files.shift();
			let func = file.type === "directory" ? rmdir : removeFile;
			
			return func(file.name).then(function() {
				return removeFiles(files);
			});
		});
	}
	
	async function stat(path) {
		if (path === "/") {
			return rootStat;
		}
		
		let entry = await readEntry(path);
		
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
	
	async function exists(path) {
		try {
			await readEntry(path);
			
			return true;
		} catch (e) {
			return false;
		}
	}
	
	function watch(path, handler) {
		if (!watchers[path]) {
			watchers[path] = [];
		}
		
		watchers[path].push(handler);
		
		return function() {
			if (!watchers[path]) {
				return;
			}
			
			watchers[path] = watchers[path].filter(h => h !== handler);
			
			if (watchers[path].length === 0) {
				delete watchers[path];
			}
		}
	}
	
	return {
		readFile,
		writeFile,
		remove: removeFile,
		unlink: removeFile,
		readdir,
		mkdir,
		rmdir,
		stat,
		rename,
		copy,
		exists,
		watch,
		
		promises: {
			async *opendir(path) {
				let entries = await readdirEntries(path);
				
				for (let entry of entries) {
					let {name, type} = entry;
					
					yield {
						name,
						
						isDirectory() {
							return type === "directory";
						},
						
						isFile()  {
							return type === "file";
						},
					};
				}
			},
		},
	};
}
