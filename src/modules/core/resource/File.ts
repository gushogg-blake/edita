import Evented from "utils/Evented";
import sleep from "utils/sleep";
import {removeInPlace} from "utils/array";
import Resource from "./Resource";
import URL from "./URL";

import {
	checkNewlines,
	normaliseNewlines,
	guessIndent,
	guessLang,
	getIndentationDetails,
} from "./utils";

/*
PURPOSE

it took a while for the need for this to become clear to me. The galvaniser
was the need to refactor the mixed newlines check out of createEditorTab:
it doesn't really belong there; that was just a convenient place to put it
as it meant we always checked just before opening a tab. And we don't want
to have to pass an extra "has the file had its newlines normalised" arg
around to everything that takes a string of code (Document, ultimately).

This also abstracts file watching and makes sure there's only one File
per URL in the app at a time (value objects, with the identity being the
URL)

NOTES

There's a bit of finesse required to make sure everything stays
in sync with async atomicity and renames but it should be solid
I think. The approach is to only allow the creation of Files when
we're reading them from disk or writing to them (as with a rename,
which is a write operation if the new file already exists on disk
when we rename a file). Each of these is tracked in a promise, so
if we try to do it twice we'll either receive the original
promise (when reading) or await it first (when writing).
*/

let files = new WeakMap<URL, File>();
let promises = new Map<URL, Promise>();

export default class File extends Evented implements Resource {
	constructor(url) {
		this.url = url;
		this.contents = null;
		this.newline = platform.systemInfo.newline;
		this.newlinesNormalised = false;
		this.changeListeners = [];
		this.saving = false;
	}
	
	checkFormat() {
		let {
			defaultIndent,
			tabWidth,
			defaultNewline,
		} = this.prefs;
		
		let indent = guessIndent(code) || defaultIndent;
		let lang = this.guessLang(code, url);
		
		let {
			mixed: hasMixedNewlines,
			mostCommon: newline,
		} = checkNewlines(code);
		
		if (!newline) {
			newline = defaultNewline;
		}
		
		let indentation = getIndentationDetails(indent, tabWidth);
		
		return {
			indentation,
			tabWidth,
			lang,
			newline,
			hasMixedNewlines,
		};
	}
		
		this.format = format;
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
			
			file.setFormat();
			
			promise.resolve(file);
		})();
		
		return promise;
	}
	
	static async read(url) {
		return files.get(url) || promises.get(url) || File.create(url);
	}
	
	static async write(url, contents) {
		let file = files.get(url);
		let promise = promises.get(url);
		
		if (!file && !promise) {
			return File.create(url, contents);
		} else if (promise) {
			file = await promise;
		}
		
		await file.save(contents);
		
		return file;
	}
	
	get path() {
		return this.url.path;
	}
	
	private async load() {
		this.contents = await platform.fs(this.path).read();
		
		this.checkFormat();
		let {mostCommon, mixed} = checkNewlines(str);
		
		if (mixed) {
			str = normaliseNewlines(str);
			
			this.newlinesNormalised = true;
		}
		
		this.contents = str;
	}
	
	async save(str) {
		this.saving = true;
		
		await platform.fs(this.path).write(str);
		
		this.saving = false;
		
		this.contents = str;
		
		this.checkFormat();
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
}

