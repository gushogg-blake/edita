import {Evented} from "utils";
import {removeInPlace} from "utils/array";
import type {DialogEnv} from "ui/dialogs";
import Entry from "./Entry";

type Mode = "selectFiles" | "selectDir" | "save"; // TYPE dedupe this

type FileChooserOptions = {
	mode: Mode;
	path: string;
};

export default class App extends Evented<{
	updateMain: void;
	updateSelected: void;
	newFolder: Entry;
	newFolderCreated: void;
	cancelNewFolder: void;
	updateBookmarks: string[];
}> {
	mode: Mode;
	dir: string;
	entries: Entry[];
	selectedEntries: Entry[];
	name: string;
	bookmarks: string[];
	breadcrumbs: any[]; // TYPE fs Node
	
	private env: DialogEnv;
	private options: FileChooserOptions;
	private hasResponded: boolean = false;
	private teardownCallbacks: Array<() => void>;
	
	constructor(env: DialogEnv, options: FileChooserOptions) {
		super();
		
		this.env = env;
		this.options = options;
		this.mode = options.mode;
		
		let node = platform.fs(options.path);
		
		if (this.mode === "save") {
			this.dir = node.parent.path;
			this.name = node.name;
		} else {
			this.dir = node.path;
			this.name = "";
		}
		
		this.breadcrumbs = this.getBreadcrumbs();
		
		this.entries = [];
		this.selectedEntries = [];
		this.bookmarks = [];
		
		this.hasResponded = false;
		
		env.setTitle(({
			selectFiles: "Select files",
			selectDir: "Select a folder",
			save: "Save as",
		})[this.mode]);
		
		this.teardownCallbacks = [
			platform.on("dialogClosed", this.onDialogClosed.bind(this)),
		];
	}
	
	async loadBookmarks() {
		let bookmarks = [
			platform.systemInfo.homeDir,
		];
		
		try {
			// PLATFORM - assumes GTK
			let str = await platform.fs(platform.systemInfo.homeDir, ".config", "gtk-3.0", "bookmarks").read();
			let lines = str.split("\n").map(s => s.trim()).filter(Boolean);
			let normalDirs = lines.filter(line => line.startsWith("file://")).map(line => line.substr("file://".length));
			
			bookmarks = [...bookmarks, ...normalDirs];
		} catch (e) {
			console.log(e);
		}
		
		this.bookmarks = bookmarks;
		
		this.fire("updateBookmarks", bookmarks);
	}
	
	async init() {
		this.load();
		this.loadBookmarks();
	}
	
	async load() {
		this.entries = (await base.DirEntries.ls(this.dir)).map(n => new Entry(false, n));
		this.selectedEntries = this.entries.length > 0 ? [this.entries[0]] : [];
		
		let newBreadcrumbs = this.getBreadcrumbs();
		
		if (!this.breadcrumbs.some(node => node.path === this.dir)) {
			this.breadcrumbs = newBreadcrumbs;
		}
		
		this.fire("updateMain");
	}
	
	getBreadcrumbs() {
		return platform.fs(this.dir).lineage;
	}
	
	setName(name) {
		this.name = name;
	}
	
	newFolder() {
		let parentDir = this.dir;
		let entry = new Entry(true);
		
		entry.on("create", async (name) => {
			let newDir = platform.fs(parentDir).child(name);
			
			await newDir.mkdirp();
			
			this.fire("newFolderCreated");
			
			this.nav(newDir.path);
		});
		
		entry.on("cancel", () => {
			this.fire("cancelNewFolder");
		});
		
		this.fire("newFolder", entry);
	}
	
	async nav(dir) {
		this.dir = dir;
		
		await this.load();
	}
	
	select(entry) {
		this.selectedEntries = [entry];
		
		this.fire("updateSelected");
	}
	
	toggleSelect(entry) {
		if (this.selectedEntries.includes(entry)) {
			removeInPlace(this.selectedEntries, entry);
		} else {
			this.selectedEntries.push(entry);
		}
		
		this.fire("updateSelected");
	}
	
	//cancel() {
	//	window.close();
	//}
	
	async ok(name) {
		if (this.mode === "selectDir") {
			this.respond({
				path: this.dir,
			});
		} else if (this.mode === "selectFiles") {
			this.respond({
				paths: this.selectedEntries.map(entry => entry.path),
			});
		} else if (this.mode === "save") {
			if (!name.trim()) {
				throw new Error("name required");
			}
			
			let node = platform.fs(this.dir).child(name);
			
			if (await node.exists()) {
				if (!confirm("Overwrite existing file?")) {
					return;
				}
			}
			
			this.respond({
				path: node.path,
			});
		}
	}
	
	async dblclick(entry: Entry) {
		let {mode} = this.options;
		let {node} = entry;
		let {path} = node;
		
		if (entry.isDir) {
			this.nav(path);
		} else {
			if (mode === "selectDir") {
				// TODO this should be disabled
			} else if (mode === "selectFiles") {
				this.respond({
					paths: [path],
				});
			} else if (mode === "save") {
				if (await node.exists()) {
					if (!confirm("Overwrite existing file?")) {
						return;
					}
				}
				
				this.respond({
					path,
				});
			}
		}
	}
	
	_respond(response) {
		if (this.hasResponded) {
			return;
		}
		
		this.env.respond(response);
		
		this.hasResponded = true;
	}
	
	cancel() {
		this.respond({
			canceled: true,
		});
	}
	
	respond(response) {
		this._respond(response);
		
		this.env.close();
	}
	
	onDialogClosed() {
		this._respond({
			canceled: true,
		});
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}
