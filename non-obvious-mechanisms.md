Non-obvious mechanisms
===

A short list of mechanisms and couplings that aren't self-evident from e.g. `require` or `import` statements.

The cause of this is usually dynamism, implicitly available global state, or some combination of the two, causing that the source of a particular symbol or object cannot be simply followed through hard-coded references in the source code.

- Theme variables. CSS can use variables like `--appBackgroundColor` without getting them from an import. These are ultimately defined in themes ([stores/themes](./src/stores/themes)) and added to the top-level component's (App.svelte's) DOM by [components/themeStyle.js](./src/components/themeStyle.js).
