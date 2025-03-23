import bluebird from "bluebird";
import promiseWithMethods from "./promiseWithMethods";

let queues = {};

export default function(config) {
	let {
		fs,
		path: osPath,
		glob,
		mkdirp,
		watch,
		cwd,
		fileIsBinary,
		homeDir,
		walk,
		minimatch,
		noBinaryFiles,
	} = config;
	
	class FileIsBinary extends Error {}
	
	class Node {
		path: string;
		basename: string;
		extension: string;
		type: string;
		lastExtension: string;
		lastType: string;
		
		constructor(path) {
			if (path instanceof Node) {
				path = path.path;
			}
			
			this.setPath(path);
		}
		
		get isRoot(): boolean {
			return this.path === osPath.resolve(this.path, "..");
		}
		
		get parent(): Node {
			return new Node(osPath.resolve(this.path, ".."));
		}
		
		get parents(): Node[] {
			let parents = [];
			let node = this;
			
			while (!node.isRoot) {
				parents.push(node.parent);
				
				node = node.parent;
			}
			
			return parents;
		}
		
		get lineage(): Node[] {
			return [...this.parents.reverse(), this];
		}
		
		get homePath(): string {
			let {path} = this;
			
			if (
				homeDir
				&& homeDir !== "/"
				&& (path === homeDir || path.startsWith(homeDir + osPath.sep))
			) {
				return "~" + path.substr(homeDir.length);
			}
			
			return path;
		}
		
		child(...paths): Node {
			return this.rel(...paths);
		}
		
		rel(...paths): Node {
			return new Node(osPath.resolve(this.path, ...paths));
		}
		
		sibling(...paths): Node {
			return this.parent.child(...paths);
		}
		
		reExt(newExtension): Node {
			if (newExtension[0] !== ".") {
				newExtension = "." + newExtension;
			}
			
			return this.sibling(this.basename + newExtension);
		}
		
		withExt(newExtension): Node {
			return this.sibling(this.name + newExtension);
		}
		
		withoutExt(): Node {
			return this.sibling(this.basename);
		}
		
		reparent(currentParent, newParent): Node {
			return new Node(newParent).rel(this.pathFrom(currentParent));
		}
		
		pathFrom(parent): string {
			if (parent instanceof Node) {
				parent = parent.path;
			}
			
			return osPath.relative(parent, this.path);
		}
		
		async mkdirp() {
			await mkdirp(this.path);
		}
		
		isDescendantOf(parent): boolean {
			if (parent instanceof Node) {
				parent = parent.path;
			}
			
			return this.parents.some(n => n.path === parent);
		}
		
		match(pattern): boolean {
			return minimatch(this.path, pattern);
		}
		
		matchName(pattern): boolean {
			return minimatch(this.path, pattern, {
				matchBase: true,
			});
		}
		
		setPath(path) {
			this.path = osPath.resolve(path.toString());
			this.name = this.isRoot ? this.path : osPath.basename(this.path);
			
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
		
		async rename(name, options={}) {
			options = {
				mkdirs: false,
				...options,
			};
			
			let newFile = this.parent.rel(name);
			
			if (options.mkdirs) {
				await newFile.parent.mkdirp();
			}
			
			await fs.rename(this.path, newFile.path);
			
			this.setPath(newFile.path);
		}
		
		async move(dest, options={}) {
			if (dest instanceof Node) {
				dest = dest.path + osPath.sep;
			}
			
			if (dest.endsWith(osPath.sep)) {
				dest += this.name;
			}
			
			await this.rename(dest, options);
		}
		
		async copy(dest, options={}) {
			options = {
				mkdirs: false,
				...options,
			};
			
			if (dest instanceof Node) {
				dest = dest.path + osPath.sep;
			}
			
			if (dest.endsWith(osPath.sep)) {
				dest += this.name;
			}
			
			if (options.mkdirs) {
				await (new Node(dest)).parent.mkdirp();
			}
			
			await fs.copy(this.path, dest);
		}
		
		readdir(dirents=false) {
			return fs.readdir(this.path, {
				withFileTypes: dirents,
			});
		}
		
		async ls(): Promise<Node[]> {
			return (await this.readdir()).map((path) => {
				return new Node(osPath.resolve(this.path, path));
			});
		}
		
		async lsWithTypes(): Promise<{isDir: boolean, node: Node}[]> {
			return (await this.readdir(true)).map((dirent) => {
				return {
					isDir: dirent.isDirectory(),
					node: new Node(osPath.resolve(this.path, dirent.name)),
				};
			});
		}
		
		async lsFiles(): Promise<Node[]> {
			return bluebird.filter(this.ls(), node => node.isFile());
		}
		
		async lsDirs(): Promise<Node[]> {
			return bluebird.filter(this.ls(), node => node.isDir());
		}
		
		glob(pattern, options): Promise<Node[]> {
			if (!glob) {
				throw new Error("No glob backend available");
			}
			
			return bluebird.map(glob(osPath.resolve(this.path, pattern), options), (file) => {
				return this.child(file);
			});
		}
		
		walk(options) {
			return walk.walk(this.path, options);
		}
		
		walkAll(options) {
			return walk.all(this.path, options);
		}
		
		watch(handler) {
			return watch(this.path, handler);
		}
		
		async contains(filename): Promise<boolean> {
			return (await this.readdir()).indexOf(filename) !== -1;
		}
		
		async isDir(): Promise<boolean> {
			try {
				return (await fs.stat(this.path)).isDirectory();
			} catch (e) {
				return false;
			}
		}
		
		async isFile(): Promise<boolean> {
			try {
				return (await fs.stat(this.path)).isFile();
			} catch (e) {
				return false;
			}
		}
		
		isBinary(): Promise<boolean> {
			return fileIsBinary(this.path);
		}
		
		async isTextFile(): Promise<boolean> {
			return await this.isFile() && !await this.isBinary();
		}
		
		async readJson(): Promise<any> {
			return JSON.parse(await this.read());
		}
		
		writeJson(json, options={}) {
			return this.write(JSON.stringify(json, null, 4), options);
		}
		
		getQueue() {
			if (!queues[this.path]) {
				queues[this.path] = [];
			}
			
			return queues[this.path];
		}
		
		async _read() {
			if (config.noBinaryFiles) {
				if (await this.isBinary()) {
					throw new FileIsBinary("File is binary: " + this.path);
				}
			}
			
			return (await fs.readFile(this.path)).toString();
		}
		
		async _write(data) {
			return await fs.writeFile(this.path, data);
		}
		
		async read() {
			let existingTask = queues[this.path]?.find(task => task.type === "read");
			
			if (existingTask) {
				return existingTask.promise;
			}
			
			let task = {
				type: "read",
				promise: promiseWithMethods(),
				inProgress: false,
			};
			
			this.getQueue().push(task);
			
			this.checkQueue();
			
			return task.promise;
		}
		
		async write(data, options={}) {
			options = {
				mkdirp: false,
				...options,
			};
			
			if (options.mkdirp) {
				await this.parent.mkdirp();
			}
			
			let task = {
				type: "write",
				data,
				promise: promiseWithMethods(),
				inProgress: false,
			};
			
			this.getQueue().push(task);
			
			this.checkQueue();
			
			return task.promise;
		}
		
		async checkQueue() {
			let queue = queues[this.path];
			let task = queue[0];
			
			if (task.inProgress) {
				return;
			}
			
			task.inProgress = true;
			
			try {
				if (task.type === "read") {
					task.promise.resolve(await this._read());
				} else {
					task.promise.resolve(await this._write(task.data));
				}
			} catch (e) {
				task.promise.reject(e);
			} finally {
				queue.shift();
				
				if (queue.length > 0) {
					this.checkQueue();
				} else {
					delete queues[this.path];
				}
			}
		}
		
		createReadStream() {
			return fs.createReadStream(this.path);
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
	
	let api = function(path=cwd(), ...paths) {
		return new Node(path).child(...paths);
	}
	
	api.FileIsBinary = FileIsBinary;
	
	return api;
}
