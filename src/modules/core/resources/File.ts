import sleep from "utils/sleep";
import {removeInPlace} from "utils/array";
import Project from "modules/core/Project";
import {hasMixedNewlines, normaliseNewlines} from "./utils";
import URL from "./URL";
import FileLike from "./FileLike";

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

---

There's a bit of finesse required to make sure everything stays
in sync with async atomicity and renames but it should be solid
I think. The approach is to only allow the creation of Files when
we're reading them from disk or writing to them (as with a rename,
which is a write operation if the new file already exists on disk
when we rename a file). Each of these is tracked in a promise, so
if we try to do it twice we'll either receive the original
promise (when reading) or await it first (when writing).

NOTE not sure if having these as value objects is a good idea. benefit
(hypothetically) is that if we have something like a split pane with two
editors and documents, they'll be pointing at the same file so will be
in sync... can't really think of other times, or any times really, that
there'll be interactions though... (also how it is now, split panes
actually wouldn't pick up changes, as we don't fire a change event
on write -- we assume only the caller wants to know about the change)

so maybe Document is the thing that should be shared -- yeah, File
doesn't make sense for the split panes case at least because we're
not saving on every keystroke anyway.

Files should probs be normal classes then. for renames a File can change
its url. for changes, we reload. Note - we'll need to do a whole re-read,
as in normalise newlines again, in case the outside program added other
ones. so for Document, just make sure to set modified again with the same
logic (ones where we've got local changes don't matter; we don't overwrite
the document with those).

still not entirely comfortable with the idea of having .contents here, as
it seems like it can so easily get out of sync with what's on disk, but
maybe that's not such a big deal. we know it'll be right just after read,
obviously, and just after re-read from change, and I think that's all that
matters -- we're not doing stuff like showing diffs of document changes
against what's on disk, at least not yet, and if we do we can re-look at
this and possibly just do a re-read then, depending on the use case.
*/

let files = new WeakMap<URL, File>();
let promises = new Map<URL, Promise>();

export default class File extends FileLike {
	newlinesNormalised: boolean = false;
	project?: Project = null;
	
	private saving: boolean = false;
	
	constructor(url) {
		this.url = url;
		this.changeListeners = [];
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

