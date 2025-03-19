import bluebird from "bluebird";
import yargs from "yargs";
import {fs, readStdin} from "utils/node";

/*
this script updates import paths based on a git patch where files
have been renamed

the patch should have lines of the form:

rename from src/path/to/old-name.{ts,svelte}
rename to src/path/to/dir/new-name.{ts,svelte}

usage:

- move a bunch of files around
- commit
- git show HEAD > patch.diff
- bun scripts/update-imports.ts patch.diff (also reads from stdin)
*/

let {argv} = yargs(process.argv);
let {name} = fs(import.meta.filename);
let positional = [...argv._];
let scriptNameIndex = positional.findIndex(s => s.endsWith(name));

if (scriptNameIndex !== -1) {
	positional = positional.slice(scriptNameIndex + 1);
}

let [patchName] = positional;

let patchContents;

if (patchName) {
	patchContents = await fs(patchName).read();
} else {
	patchContents = await readStdin();
}

let lines = patchContents.split("\n");

let from;
let to;

let renames = [];

for (let line of lines) {
	if (line.startsWith("rename")) {
		let [all, f, filename, ext] = line.match(/^rename (from|to) src\/(.+)\.(ts|svelte)$/);
		
		if (ext !== "ts") {
			filename += "." + ext;
		}
		
		filename = filename.replace(/\/index$/, "");
		
		if (from) {
			renames.push({from, to: filename});
			
			from = null;
		} else {
			from = filename;
		}
	}
}

if (renames.length === 0) {
	console.log("No renames found.");
	
	process.exit();
}

let dirs = ["src", "test"];

for (let dir of dirs.map(d => fs(d))) {
	let files = await dir.glob("**/*.{ts,svelte}");
	
	await bluebird.map(files, async (file) => {
		let code = await file.read();
		
		for (let {from, to} of renames) {
			let find = ` from "${from}";`;
			let replaceWith = ` from "${to}";`;
			
			code = code.replaceAll(find, replaceWith);
		}
		
		await file.write(code);
	});
}
