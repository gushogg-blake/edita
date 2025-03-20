import Evented from "utils/Evented";
import sleep from "utils/sleep";
import {removeInPlace} from "utils/array";
import Resource from "./Resource";
import URL from "./URL";

/*
PURPOSE

it took a while for the need for this to become clear to me. The galvaniser
was the need to refactor the mixed newlines check out of createEditorTab:
it doesn't really belong there; that was just a convenient place to put it
as it meant we always checked just before opening a tab. And we don't want
to have to pass an extra "has the file had its newlines normalised" arg
around to everything that takes a string of code (Document, ultimately).

So the purpose is this:

- we're dealing with files, but sometimes also new (unsaved) files, and
maybe we want tabs that are other things entirely (refactor preview for
example) -- all that is nicely expressed as a URL (file:///..., new:///...,
special://refactor-preview, etc). So we need URLs, not just paths. This
also makes it easier to support e.g. network files later.

- we need a File abstraction (also something I didn't realise was needed
until now). This gives us somewhere to put things like "does this file
have mixed newlines?", possibly other format info, as well as loading
and saving.

- to open a file, we need its URL, and a File for it. We could put the URL
in the File class, as all Files have URLs, but not all "things" have Files
-- new files and special tabs don't. We still want a single object that
we can pass to things that want "a URL, and maybe a File", so we have
Resource.

Thinking about it, it would probably make more sense for File to be a
subclass of Resource...
*/

let files = new WeakMap<URL, File>();
let promises = new Map<URL, Promise>();

export default class File extends Evented implements Resource {
	constructor(url) {
		this.url = url;
		this.contents = null;
		this.changeListeners = [];
		this.saving = false;
	}
	
	listen(fn) {
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
	
	/*
	static read() and write() bring a file into our purview
	by reading it or writing to it respectively.
	
	these are the only ways we can create a File, so we know
	(as far as we can know, given a multiprocess OS environment)
	that the contents are in sync upon creation
	*/
	
	private static async create(url, contents=null) {
		let promise = promiseWithMethods();
		
		promises.set(url, promise);
		
		promise.then((file) => {
			instances.set(url, file);
		}).finally(() => {
			promises.delete(url);
		});
		
		(async () => {
			let file = new File(url);
			
			if (contents !== null) {
				await file.save(contents);
			} else {
				await file.load();
			}
			
			promise.resolve(file);
		})();
		
		return promise;
	}
	
	private static async read(url) {
		return files.get(url) || promises.get(url) || File.create(url);
	}
	
	private static async write(url, contents) {
		let file = files.get(url);
		let promise = promises.get(url);
		
		if (!file && !promise) {
			return File.create(url, contents);
		} else if (promise) {
			file = await promise;
		}
		
		await file.write(contents);
		
		return file;
	}
	
	get path() {
		return this.url.path;
	}
	
	async load() {
		this.contents = await platform.fs(this.path).read();
	}
	
	async save(str) {
		this.saving = true;
		
		await platform.fs(this.path).write(str);
		
		this.contents = str;
		
		this.saving = false;
	}
	
	/*
	returns a different instance, as there might already be an
	instance for the new URL and we need to keep a one to one
	mapping (not have multiple Files for a single URL). (not sure
	why exactly, it's defo conceptually wrong though and I think
	would introduce the possibility of them getting out of sync
	if different parts of the code had different File instances
	representing the same file. also, keeping it one to one means
	we can do fileA === fileB if we want.)
	
	code that deals with Files should handle rename and replace
	the instance with the new one.
	*/
	
	async rename(url) {
		if (url === this.url) {
			return;
		}
		
		let newFile = await File.write(url, this.contents);
		
		this.delete();
		
		this.fire("rename", newFile);
		
		return newFile;
	}
	
	async delete() {
		await platform.fs(this.path).delete();
	}
	
	async exists() {
		return await platform.fs(this.path).exists();
	}
}
