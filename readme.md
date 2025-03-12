# Edita

Edita is a code editor combining novel features and interactions with a familiar GUI interface.

See [edita.vercel.app](//edita.vercel.app/).

## Project status

This started from a frustration with traditional editors' lack of understanding of the structure of code, and corresponding lack of support for semantic edits. I also think editors are mostly still stuck in a "code is just text" paradigm, which is mostly true, but restricts thinking around designing intuitive and ergonomic interfaces.

I originally wanted to make a product out of it, but there's too much work for one person to make an editor with all the features people need these days - LSP servers, git integration, etc.

It's also slow -- typing lags sometimes even on small documents, which is bearable for me but puts it off the table for commercial adoption. I think a canvas-based renderer using a Tree-sitter AST for syntax highlighting (which Edita is) can theoretically be fast enough, but again it would take time. The renderer isn't currently very amenable to caching - I've described these issues a bit in GitLab issues.

So I'm mostly treating it as a project just for personal use at the moment, and not worrying too much about making it accessible either for other users -- official Windows and Mac support is not on the roadmap, for example -- or for potential contributors. That said, if this project interests you enough for you to start poking around in the code, I would welcome [emails](mailto:gus@gushogg-blake.com) or GitLab/GitHub discussions about potential contributions.

## High-level overview of the code

This project is based on Electron, which allows you to write a web app and package it as a desktop application (it runs a version of the Chromium browser that communicates with a Node process, both of which have access to Electron APIs).

So it's mostly a web app, and there is a fully working web version that uses e.g. IndexedDB in place of the actual filesystem for saving files. Platform specific code is in src/platforms, and "platform" in this sense just means "Electron or web", not Linux/another OS. Within the Electron (desktop) platform code, I have mostly tried to stick to using e.g. `path.sep` instead of assuming Linux, but I am biased towards Linux. I have mostly marked platform assumptions with `// PLATFORM` comments.

It doesn't use a drop-in code editor component, or even `textarea` or `contenteditable`: all the functionality of basic text editing is implemented from the ground up.

The UI is written in Svelte v3. For syncing up the data with the UI, I follow a simple but repetitive pattern of duplicating relevant app state in the Svelte components and wiring up event handlers to update them.

The app can theoretically be instantiated with no UI, and the UI added later, and everything would just work, due to this simple paradigm. The app doesn't know much more than it needs to about the UI.

### Tree-sitter and languages

Tree-sitter and most languages (grammars) are listed as NPM dependencies and built with a script (`npm run build-parsers`). The Tree-sitter WASM file comes with the `web-tree-sitter` package so doesn't need to be built; parsers are built with `build-parsers`.

Some grammar packages don't conform to the latest Tree-sitter, which requires a tree-sitter.json file. The WASMs for these are present but won't be built by the script. See [vendor/public/tree-sitter/langs/readme.md](vendor/public/tree-sitter/langs/readme.md) for details.

All grammar WASM files are tracked in this repo, so you don't need to build them unless you're updating them.

## Patches

- web-tree-sitter is patched to fix an issue where environment detection thinks Electron (the renderer/browser process) is Node because it has access to Node APIs.

## Hacks

Hacky stuff is marked with either a `// HACK` or `// PLATFORM` comment (for stuff that makes platform assumptions).
