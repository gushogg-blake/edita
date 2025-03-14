Script to build Tree-sitter grammars.

The grammars used to be devDependencies in the main package but since Tree-sitter is pre-1.0, the grammars' peerDependency versions were too easily generating conflicts. These are spurious, but I didn't want to start doing `npm i --force` or `--legacy-peer-deps` in the main repo.

Use `--force` to install dependencies in this package.
