wasm files either prebuilt, built by build-parsers script, or manually built.

see scripts/tree-sitter for more details.

vala wasm is manually built from https://github.com/vala-lang/tree-sitter-vala with:

```bash
npm i tree-sitter-cli@0.20.8
git clone https://github.com/vala-lang/tree-sitter-vala
npx tree-sitter build --wasm tree-sitter-vala
```

This creates tree-sitter-vala.wasm in the current dir.
