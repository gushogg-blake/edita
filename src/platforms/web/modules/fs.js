let osPath = require("path-browserify");
let minimatch = require("minimatch-browser");

module.exports = function(backend) {
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
	}
	
	return function(path="/", ...paths) {
		return new Node(path).child(...paths);
	}
}
