Tree-sitter
===

Edita uses a fork of tree-sitter with the following changes:

- fix environment detection in lib/binding_web/binding.js (the old check checked for node globals like `process`, which are available in the renderer process in Electron).

- statically link parsers in script/build-wasm to support the following langs, which use system libraries that aren't in the main lib/binding_web/exports.json list:

	- Ruby
	
	See:
	
	- https://github.com/emscripten-core/emscripten/issues/8308
	- https://emscripten.org/docs/compiling/Dynamic-Linking.html (System Libraries section)
	- https://github.com/tree-sitter/tree-sitter/issues/949
	
	There are two other solutions suggested in the emscripten docs:
	
	- add `EMCC_FORCE_STDLIBS=1` and `-s EXPORT_ALL=1` to the `emcc` command in tree-sitter
	
	- add missing symbols to exports.json (as described in #949)
	
	but neither of these worked.
	
	The disadvantage of static linking is that you can't combine static and dynamic linking, so if any langs need to be statically linked then they all need to be.
	
	This means that all supported langs need to be loaded on startup, which will introduce lag at some point.

Fork: https://github.com/gushogg-blake/tree-sitter

## Creating tree-sitter.wasm and tree-sitter.js

```bash
cd projects/tree-sitter
./script/build-wasm
```

The files (`tree-sitter.js` and `tree-sitter.wasm`) are created in `lib/binding_web`.

### Static linking

The `--static` option generates statically linked files. These will have a `-static` suffix.

To enable switching between static and dynamic linking as easily as possible, we keep both versions in Edita. The currently active version is just called `tree-sitter.js`

## Creating language wasm files

Wasm files can be created with a non-patched tree-sitter installed as `tree-sitter-cli`.
Requires `@gushogg-blake/tree-sitter-cli` (latest as in last published, but it will be 0.20.x, not 0.21.0 which broke dependencies) (with the patched exports.json) for `npx tree-sitter`.

```bash
git clone https://github.com/.../tree-sitter-[lang]
npx tree-sitter build-wasm tree-sitter-[lang]
```

## Patching exports.json for a lang

If a lang's wasm version causes errors, it might need symbols adding to exports.json. To get a list of the symbols it needs:

```bash
cd dev/tree-sitter-[lang]
docker run --rm -it -v $PWD:/src emscripten/emsdk emcc -I src -c -o src/scanner.wasm.o src/scanner.cc
docker run --rm -it -v $PWD:/src emscripten/emsdk bash -c "/emsdk/upstream/bin/llvm-objdump -t src/scanner.wasm.o" | grep '*UND*'
```

(Add `--demangle` to the second command to see C++ symbol names).

Copy all the symbols to exports.json if not already there. Some symbols might cause errors - run `./script/build-wasm` from tree-sitter to check. Examples from ruby:

```
___cxa_allocate_exception
___cxa_throw
```

Remove these and re-run the build until it works, then:

- bump the minor version number for cli/npm and update lib/Cargo.toml to match

- commit the changes and tag as `v` followed by the version number

- push to GitHub, publish cli/npm and wait for GitHub CI to run

- install the latest version, e.g. `npm i @gushogg-blake/tree-sitter-cli@0.20.11`

- build wasm file as above

## Misc

Emscripten settings: https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
