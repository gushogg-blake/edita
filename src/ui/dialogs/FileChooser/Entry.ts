import {Evented} from "utils";
import type {DirEntry} from "base/DirEntries";

export default class extends Evented<{
	create: string;
	rename: string;
	cancel: void;
	cancelRename: void;
	requestRename: void;
}> {
	node: any; // TYPE fs Node
	path: string | null;
	isDir: boolean;
	isNew: boolean;
	
	constructor(isNew: boolean, dirEntry?: DirEntry) {
		super();
		
		if (isNew) {
			this.node = null;
			this.path = null;
			this.isDir = true;
		} else {
			let {node, path, isDir} = dirEntry;
			
			this.node = node;
			this.path = path;
			this.isDir = isDir;
		}
		
		this.isNew = isNew;
	}
	
	async rename(name) {
		if (this.isNew) {
			this.fire("create", name);
		} else {
			await this.node.rename(name);
			
			this.path = this.node.path;
			
		}
		
		this.fire("rename", this.name);
	}
	
	cancelRename() {
		if (this.isNew) {
			this.fire("cancel");
		} else {
			this.fire("cancelRename");
		}
	}
	
	requestRename() {
		this.fire("requestRename");
	}
	
	get name() {
		return this.node?.name || "";
	}
}
