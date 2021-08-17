let bluebird = require("bluebird");

module.exports = function(backends) {
	let {
		fs,
		path: osPath,
		minimatch,
		cwd,
	} = backends;
	
	class Node {
		constructor(path) {
			if (path instanceof Node) {
				path = path.path;
			}
			
			this.setPath(path);
		}
		
		get isRoot() {
			return this.path === this.parent.path;
		}
		
		get parent() {
			return new Node(osPath.resolve(this.path, ".."));
		}
		
		child(...paths) {
			let node = this;
			
			for (let path of paths) {
				node = node.rel(path);
			}
			
			return node;
		}
		
		rel(path) {
			return new Node(osPath.resolve(this.path, path.toString()));
		}
		
		sibling(...paths) {
			return this.parent.child(...paths);
		}
		
		reExt(newExtension) {
			if (newExtension[0] !== ".") {
				newExtension = "." + newExtension;
			}
			
			return this.sibling(this.basename + newExtension);
		}
		
		withExt(newExtension) {
			return this.sibling(this.name + newExtension);
		}
		
		withoutExt() {
			return this.sibling(this.basename);
		}
		
		reparent(currentParent, newParent) {
			return new Node(newParent).rel(this.pathFrom(currentParent));
		}
		
		pathFrom(parent) {
			if (parent instanceof Node) {
				parent = parent.path;
			}
			
			return osPath.relative(parent, this.path);
		}
		
		async mkdirp() {
			await mkdirp(this.path);
		}
		
		isDescendantOf(parent) {
			if (parent instanceof Node) {
				parent = parent.path;
			}
			
			parent = parent.replace(/\/$/, "");
			
			return this.path.indexOf(parent) === 0 && this.path.length > parent.length;
		}
		
		match(pattern) {
			return minimatch(this.path, pattern);
		}
		
		matchName(pattern) {
			return minimatch(this.path, pattern, {
				matchBase: true,
			});
		}
		
		setPath(path) {
			this.path = osPath.resolve(path.toString());
			this.name = osPath.basename(this.path);
			
			if (this.name[0] === ".") {
				let name = this.name.substr(1);
				
				let extIndex = name.indexOf(".");
				let lastExtIndex = name.lastIndexOf(".");
				let hasExt = extIndex !== -1;
				
				this.basename = this.name;
				this.extension = hasExt ? name.substr(extIndex) : "";
				this.type = this.extension.substr(1);
				this.lastExtension = hasExt ? name.substr(lastExtIndex) : "";
				this.lastType = this.lastExtension.substr(1);
			} else {
				let extIndex = this.name.indexOf(".");
				let lastExtIndex = this.name.lastIndexOf(".");
				let hasExt = extIndex !== -1;
				
				this.basename = hasExt ? this.name.substr(0, extIndex) : this.name;
				this.extension = hasExt ? this.name.substr(extIndex) : "";
				this.type = this.extension.substr(1);
				this.lastExtension = hasExt ? this.name.substr(lastExtIndex) : "";
				this.lastType = this.lastExtension.substr(1);
			}
		}
		
		stat() {
			return fs.stat(this.path);
		}
		
		lstat() {
			return fs.lstat(this.path);
		}
		
		async _delete(ignoreEnoent=false) {
			try {
				if (await this.isDir()) {
					await this.rmdir();
				} else {
					await this.unlink();
				}
			} catch (e) {
				if (!ignoreEnoent || e.code !== "ENOENT") {
					throw e;
				}
			}
		}
		
		delete() {
			return this._delete();
		}
		
		deleteIfExists() {
			return this._delete(true);
		}
		
		async rename(find, replace) {
			let newPath;
			
			if (replace) {
				newPath = this.name.replace(find, replace);
			} else {
				newPath = find;
			}
			
			let newFile = this.sibling(newPath);
			
			await fs.rename(this.path, newFile.path);
			
			this.setPath(newFile.path);
		}
		
		async move(dest) {
			await this.rename(dest);
		}
		
		async copy(dest) {
			if (dest instanceof Node) {
				dest = dest.path;
			}
			
			await fs.copy(this.path, dest);
		}
		
		readdir() {
			return fs.readdir(this.path);
		}
		
		async ls() {
			return (await this.readdir()).map((path) => {
				return new Node(osPath.resolve(this.path, path));
			});
		}
		
		async lsFiles() {
			return bluebird.filter(this.ls(), node => node.isFile());
		}
		
		async lsDirs() {
			return bluebird.filter(this.ls(), node => node.isDir());
		}
		
		async contains(filename) {
			return (await this.readdir()).indexOf(filename) !== -1;
		}
		
		async isDir() {
			try {
				return (await fs.stat(this.path)).isDirectory();
			} catch (e) {
				return false;
			}
		}
		
		async isFile() {
			try {
				return (await fs.stat(this.path)).isFile();
			} catch (e) {
				return false;
			}
		}
		
		async readJson() {
			return JSON.parse(await this.read());
		}
		
		writeJson(json) {
			return this.write(JSON.stringify(json, null, 4));
		}
		
		async read() {
			return (await fs.readFile(this.path)).toString();
		}
		
		async write(data) {
			return fs.writeFile(this.path, data);
		}
		
		exists() {
			return fs.exists(this.path);
		}
		
		rmdir() {
			return fs.rmdir(this.path);
		}
		
		unlink() {
			return fs.unlink(this.path);
		}
		
		rmrf() {
			return fs.remove(this.path);
		}
	}
	
	return function(path=cwd(), ...paths) {
		return new Node(path).child(...paths);
	}
}
