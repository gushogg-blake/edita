import sleep from "utils/sleep";
import {removeInPlace} from "utils/array";
import {Project} from "modules/core";
import {hasMixedNewlines, normaliseNewlines} from "./utils";
import FileLike from "./FileLike";

/*
PURPOSE

it took a while for the need for this to become clear to me. The galvaniser
was the need to refactor the mixed newlines check out of createEditorTab:
it doesn't really belong there; that was just a convenient place to put it
as it meant we always checked just before opening a tab. And we don't want
to have to pass an extra "has the file had its newlines normalised" arg
around to everything that takes a string of code (Document, ultimately).
*/

export default class File extends FileLike {
	newlinesNormalised: boolean = false;
	project?: Project = null;
	
	private saving: boolean = false;
	
	private constructor(url) {
		super();
		
		this.url = url;
		this.changeListeners = [];
	}
	
	private static async create(url, contents=null) {
		let file = new File(url);
		
		if (contents !== null) {
			await file.save(contents);
		} else {
			await file.load();
		}
		
		await file.ensureRequiredLangsInitialised();
		
		return file;
	}
	
	static async read(url) {
		return File.create(url);
	}
	
	static async write(url, contents) {
		return File.create(url, contents);
	}
	
	get path() {
		return this.url.path;
	}
	
	private async load() {
		let str = await platform.fs(this.path).read();
		
		if (hasMixedNewlines(str)) {
			str = normaliseNewlines(str);
			
			this.newlinesNormalised = true;
		}
		
		this.contents = str;
		this.updateFormat();
	}
	
	async save(str) {
		this.saving = true;
		
		await platform.fs(this.path).write(str);
		
		this.saving = false;
		
		this.contents = str;
		
		this.updateFormat();
	}
	
	async rename(url) {
		if (url === this.url) {
			return;
		}
		
		let oldUrl = this.url;
		
		this.url = url;
		
		await this.save();
		
		this.fire("rename", url);
		
		platform.fs(oldUrl.path).delete();
	}
	
	async delete() {
		await platform.fs(this.path).delete();
	}
	
	async exists() {
		return await platform.fs(this.path).exists();
	}
	
	watch(fn) {
		this.changeListeners.push(fn);
		
		if (this.changeListeners === 1) {
			this.teardownWatch = platform.fs(this.path).watch(this.onWatchEvent.bind(this));
		}
		
		return () => {
			removeInPlace(this.changeListeners, fn);
			
			if (this.changeListeners.length === 0) {
				this.teardownWatch();
				
				delete this.teardownWatch;
			}
		}
	}
	
	async onWatchEvent() {
		if (this.saving) {
			return;
		}
		
		try {
			if (await this.exists()) {
				await sleep(50); // read can return blank sometimes otherwise
				await this.load();
			} else {
				throw new Error("file doesn't exist");
			}
		} catch (e) {
			// maybe deleted - set contents back to null to indicate
			// unknown state
			this.contents = null;
		}
		
		for (let fn of this.changeListeners) {
			fn();
		}
	}
}
