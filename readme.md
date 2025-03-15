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

Tree-sitter and most languages (grammars) are listed as NPM dependencies in the scripts/tree-sitter package* and built with a script (`npm run build-parsers` from the main package). The Tree-sitter WASM file comes with the `web-tree-sitter` package so doesn't need to be built; parsers are built with `build-parsers`.

\* This isn't a full-fledged monorepo or anything; see the readme for why tree-sitter was split out.

Some grammar packages don't conform to the latest Tree-sitter, which requires a tree-sitter.json file. The WASMs for these are present but won't be built by the script. See [vendor/public/tree-sitter/langs/readme.md](vendor/public/tree-sitter/langs/readme.md) for details.

All grammar WASM files are tracked in this repo, so you don't need to build them unless you're updating them.

## Hacks

Hacky stuff is marked with either a `// HACK` or `// PLATFORM` comment (for stuff that makes platform assumptions).

## Plugins?

Normally things like language support would be implemented as plugins. I haven't done a plugin system here because it never seemed necessary and would add a layer of complexity.

This means that everything is baked in and not much can be configured without changing the code. One of the aims when building Edita was to keep it as easy to hack on as possible, but as with any non-trivial project this isn't really attainable. I do think it's the right trade-off for the project as it stands, though, because the target user is me and anyone else who cares enough about the kinds of thing I do to write their own editor or try a niche one.

I also think this might be the right way to go for an editor project in general. I think there's a case to be made for one person or team making something and just getting it right. This will always limit it to a small market, of course, but maybe that's OK.

This "one person" approach is also how I like to approach software projects. I've always felt that working with other developers was a bit like having two artists painting on the same canvas, in the sense that you wouldn't expect that to go very well or be very satisfying for anyone involved, and the less so the more the people cared about their craft.

## Stack

### Electron

Electron now strongly discourages using `ipcRenderer` directly from the renderer and instead recommends preload scripts. Not sure how much of an issue this is.

Imports: there's some complexity around how imports work. With a bundler this shouldn't be an issue, but you never know. Later versions might have made it harder to require Node imports directly in the renderer. See caveats here: https://www.electronjs.org/docs/latest/tutorial/esm. You can't `import` Node stuff from the renderer, apparently. So we might need to use a preload script and totally refactor the IPC stuff.

### Building

There are a handful of electron-vite projects that have pre-configured defaults and make things like HMR work in Electron.

I don't think it's a good idea to use these, at least not yet:

- They seem to be single-person projects

- My use-case is complex; for example one of them that I looked at only seemed to support a single entrypoint. What about dialogs?

- I have a working rollup build with hot reloading mostly working; getting another whole project involved and figuring out how to get it working with an already complex project would add a whole other dimension of complexity to the port.

- These might be opinionated about assets. This might be a good thing (could get rid of a lot of custom logic and protocol handlers if it Just Works) but could also be another source of friction.

On the pros side, these projects are more likely to be up-to-date with how Electron works these days (going from 22 to 35) and have likely put a lot of effort into making it work and getting good DX.

If getting the rollup build working is a pain anyway then it might be worth just taking the plunge. With a single entrypoint, maybe we could make the entrypoint able to display all the dialogs? That would reduce build complexity anyway, even if implemented in current rollup config, as there's a build for each dialog. If we did a dynamic import we could avoid loading the entire JS where not necessary... probs best not to worry about this and let Vite handle it -- treat the renderer main as a bootstrap that uses dynamic import to load a diff main file per page. Or just include everything, probably simpler. I think from doing SK stuff that Vite can build different entrypoints for dynamic imports if the path isn't too dynamic (fixed number of parts), so that is probs an option though.

### Svelte

Svelte 5. No runes in non-Svelte code atm.

### TypeScript

I use TypeScript mostly for convenience: go-to-definition, type hints, etc, and to improve the authoring experience where a type annotation is the most natural way to express and keep track of what something is. I don't think this is always the case and I think the friction introduced by the type checker when holding oneself to zero type errors is underappreciated. Types should work for you, not the other way around. Part of the beauty of JS was always the ability to create objects in a way that makes sense without having to define everything up front. For example, splitting a large class up into a few different namespaces shouldn't require type definitions. Sometimes it just is what it is, and it's fine for that to be in the programmer's head, especially for things where the "correct" TS definition would have to be hedged, but the "real" reality is that something will just always be what you expect. The main area where I really wanted to write a type annotation before the TS conversion was in CodePatterns, when dealing with all the various representations of "a bit of text in a file" as it went through the find/replace process. (Is it a string, an indent/string pair, ... etc).
