import Evented from "utils/Evented";
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
	constructor(url, contents) {
		this.url = url;
		this.contents = contents;
		this.writeQueue = [];
	}
	
	static async fromUrl(url, contents=null) {
		if (files.has(url)) {
			return files.get(url);
		}
		
		if (promises.has(url)) {
			return promises.get(url);
		}
		
		let promise = promiseWithMethods();
		
		promises.set(url, promise);
		
		promise.finally(() => {
			promises.delete(url);
		});
		
		(async () => {
			let file = new File(url, contents);
			
			if (contents === null) {
				await file.load();
			}
		})();
		
		
		promises.set(url, promise);
		
		
		if (!instances.has(url)) {
			instances.set(url, new File(url));
		}
		
		return instances.get(url);
	}
	
	get path() {
		return this.url.path;
	}
	
	async load() {
		this.contents = await this.read();
	}
	
	async read() {
		return await platform.fs(this.path).read();
	}
	
	async save(str) {
		await this.write(str);
		
		this.contents = str;
	}
	
	async write(str) {
		await platform.fs(this.path).write(str);
	}
	
	/*
	returns a different instance, as there might already be an
	instance for the new URL and we need to keep a one to one
	mapping
	*/
	
	async rename(url) {
		let newFile;
		let existingFile = files.get(url);
		let existingPromise = promises.get(url);
		
		if (existingFile) {
			await existingFile.write(this.contents);
			
			newFile = existingFile;
		} else if (existingPromise) {
			newFile = await existingPromise;
		} else {
			await this.delete();
			
			newFile = await File.fromUrl(url, this.contents);
		}
		
		this.fire("rename", newFile);
	}
	
	overwrite(contents) {
		this.contents = contents;
		
		this.fire("change");
	}
	
	async delete() {
		await platform.fs(this.path).delete();
	}
	
	async exists() {
		return await platform.fs(this.path).exists();
	}
}
