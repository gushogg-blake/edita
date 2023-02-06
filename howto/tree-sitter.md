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

## Creating tree-sitter.wasm and tree-sitter.js

```bash
cd projects/tree-sitter
./script/build-wasm --static
```

The `--static` option indicates static linking. The list of langs to statically link is hard-coded in `build-wasm`.

The files (`tree-sitter.js` and `tree-sitter.wasm`) are created in `lib/binding_web`.

## Creating language wasm files

Wasm files can be created with a non-patched tree-sitter installed as `tree-sitter-cli`.

```bash
git clone https://github.com/.../tree-sitter-[lang]
npx tree-sitter build-wasm tree-sitter-[lang]
```

The language wasm file will be created in the current dir.

## Misc

Emscripten settings: https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
