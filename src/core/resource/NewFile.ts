import nextName from "utils/nextName";
import {type URL} from "core";
import FileLike from "./FileLike";

/*
NOTE no reason for these to have static constructors now;
they were left over from these being single-instance classes.

I realised WeakMap tracks the key, not the value, so can't have
primitive keys. An alternative would be to do manual reference
counting, which I don't think is as scary as it sounds, it's
just like event handlers but the other way around...

Yeah, that would be the pattern -- you tell File you want a file,
it gives you a reference, and you have to tell the reference when
you're done with it. Still don't think there's much actual value
to it though.
*/

export default class NewFile extends FileLike {
	constructor(url: URL) {
		super(url);
		
		this.contents = "\n";
		
		this.updateFormat();
	}
	
	static async create(url: URL): Promise<NewFile> {
		let newFile = new NewFile(url);
		
		await newFile.ensureRequiredLangsInitialised();
		
		return newFile;
	}
}
