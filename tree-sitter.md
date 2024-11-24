Tree-sitter

- no longer need to do static linking (https://github.com/tree-sitter/tree-sitter/issues/949#issuecomment-2323036410)

- submit PR if necessary for web/node check fix

- use standard install

- incorporate repos into here and make a script for easier upgrading of packages. npm run upgrade-all-langs, check, then roll back ones with errors.

- update paths so we can just keep wasm files in the nested repos
