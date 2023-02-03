Tree-sitter
===

Edita uses a fork of tree-sitter with the following changes:

- fix environment detection in lib/binding_web/binding.js

- patch lib/binding_web/exports.json to fix the following langs:

	- Ruby
	
	(See https://github.com/tree-sitter/tree-sitter/issues/949)

Fork: https://github.com/gushogg-blake/tree-sitter

## Creating tree-sitter.wasm and tree-sitter.js

```bash
cd projects/tree-sitter
./script/build-wasm
```

The files are created in `lib/binding_web`.

## Creating language wasm files

Requires `@gushogg-blake/tree-sitter-cli@0.20.11` (with the patched exports.json) for `npx tree-sitter`.

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

Remove these an re-run the build until it works, then:

- bump the minor version number for cli/npm and update lib/Cargo.toml to match

- commit the changes and tag as `v` followed by the version number

- push to GitHub, publish cli/npm and wait for GitHub CI to run

- install the latest version, e.g. `npm i @gushogg-blake/tree-sitter-cli@v0.20.11`

- build wasm file as above

## Misc

Emscripten settings: https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
