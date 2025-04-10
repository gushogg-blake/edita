import bluebird from "bluebird";
import {Evented} from "utils";
import type {App} from "ui/app";
import type {DirEntry} from "base/DirEntries";

export default class extends Evented<{
	updateRootDir: void;
	updateExpandedDirs: void;
}> {
	rootEntry: DirEntry;
	expandedDirs = new Set<string>();
	
	private dir: string;
	private app: App;
	
	constructor(app) {
		super();
		
		this.app = app;
		this.dir = platform.systemInfo.homeDir;
		this.expandedDirs = new Set();
	}
	
	async init() {
		let options = await base.stores.fileTree.load();
		
		if (options) {
			this.dir = options.rootDir;
		}
		
		this.rootEntry = await this.getRootEntry();
	}
	
	async setRootDir(dir) {
		this.dir = dir;
		this.rootEntry = await this.getRootEntry();
		
		base.stores.fileTree.save({
			rootDir: dir,
		});
		
		this.fire("updateRootDir");
	}
	
	async up() {
		await this.setRootDir(this.rootEntry.node.parent.path);
	}
	
	setExpandedDirs(dirs) {
		this.expandedDirs = new Set(dirs);
		
		this.fire("updateExpandedDirs");
	}
	
	toggleDir(path): void {
		if (this.expandedDirs.has(path)) {
			this.expandedDirs.delete(path);
		} else {
			this.expandedDirs.add(path);
		}
		
		this.fire("updateExpandedDirs");
	}
	
	getRootEntry(): DirEntry {
		return base.DirEntries.createEntry(this.dir);
	}
}
