Tree-sitter
===

Edita uses a fork of tree-sitter with the following changes:

- fix environment detection in lib/binding_web/binding.js (the old check checked for node globals like `process`, which are available in the renderer process in Electron).

- statically link parsers in script/build-wasm to support the following langs, which use system libraries that aren't in the main lib/binding_web/exports.json list:

	- Ruby
	- Svelte
	
	See:
	
	- https://github.com/emscripten-core/emscripten/issues/8308
	- https://emscripten.org/docs/compiling/Dynamic-Linking.html (System Libraries section)
	- https://github.com/tree-sitter/tree-sitter/issues/949
	
	There are two other solutions suggested in the emscripten docs:
	
	- add `EMCC_FORCE_STDLIBS=1` and `-s EXPORT_ALL=1` to the `emcc` command in tree-sitter
	
	- add missing symbols to exports.json (as described in #949)
	
	but neither of these worked.
	
	The only disadvantage of static linking is that the langs will be loaded unconditionally on startup, taking up some of the startup time that we want to use for loading common langs.

- add support for statically linked modules to `Language.load` in lib/binding_web/binding.js

Fork: https://github.com/gushogg-blake/tree-sitter

## emscripten/emsdk/llvm

A recent version of `emcc` (emscripten) must also be used, in order to get this change: https://github.com/emscripten-core/emscripten/pull/18382 (use locateFile in dynamic module loader):

```bash
emcc -v # 3.1.43-git
```

This probably has to be installed via `emsdk`:

- Clone the latest `emsdk` from https://github.com/emscripten-core/emsdk

- From there run:

	```bash
	./emsdk install emscripten-main-64bit
	./emsdk activate emscripten-main-64bit
	```
	
	(Not sure if emsdk requires an installation step, may need one if you get an error here).
	
	This will give instructions on getting the latest `emcc` onto `$PATH`.

The latest version of `emcc` also depends on the latest version of `llvm`:

```bash
./emsdk install llvm-git-main-64bit
./emsdk activate llvm-git-main-64bit
```

I got errors on the install step for llvm first time and had to install cmake, then run `sudo ./emsdk install llvm-git-main-64bit` to avoid a permissions error, then `chown -R gus:gus ./llvm`, then install and activate (both above commands again) without sudo.

Tools available for installation with emsdk can be seen by running `./emdsk list`.

The tree-sitter scripts should now use the latest version of `emcc` (you'll have to reload the shell or run the command again to get it onto `$PATH`).

## Generating tree-sitter.wasm and tree-sitter.js

```bash
cd projects/tree-sitter
./script/build-wasm --static # add --debug to generate debug version (see below)
```

The `--static` option indicates static linking. The list of langs to statically link is hard-coded in `build-wasm`.

The files (`tree-sitter.js` and `tree-sitter.wasm`) are created in `lib/binding_web`.

## Tree-sitter versions

There are two versions of tree-sitter.js and tree-sitter.wasm in `/vendor/public/tree-sitter` which have been generated with and without the `--debug` flag. The currently active pair are just called `tree-sitter` and the other ones have either a `-debug` or `-minified` suffix. To switch between them, run:

```bash
./scripts/tree-sitter-version # print current version
./scripts/tree-sitter-version -s # toggle between versions
./scripts/tree-sitter-version debug # activate debug
./scripts/tree-sitter-version minified # activate minified
```

When generating new versions, copy to `/vendor/public/tree-sitter` and name appropriately depending on the currently active version. (To generate the debug version, add `--debug` to the `build-wasm` command above.)

## Creating language wasm files

Wasm files can be created with a non-patched tree-sitter installed as `tree-sitter-cli`.

```bash
git clone https://github.com/.../tree-sitter-[lang]
npx tree-sitter build-wasm tree-sitter-[lang]
```

The language wasm file will be created in the current dir.

## Misc

Emscripten settings: https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
