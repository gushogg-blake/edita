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

This means that everything is baked in and not much can be configured without changing the code. One of the aims when building Edita was to keep it as easy to hack on as possible. As with any non-trivial project this has become less of a reality in practice, but I hope the relative simplicity makes it more approachable than average.

## Stack

### Electron

Electron now strongly discourages using `ipcRenderer` directly from the renderer and instead recommends preload scripts. We are still using nodeIntegration and require()ing electron imports directly from the renderer for now.

### Building

There are a handful of electron-vite projects that have pre-configured defaults and make things like HMR work in Electron.

I don't think it's a good idea to use these, at least not yet:

- They seem to be single-person projects

- My use-case is complex; for example one of them that I looked at only seemed to support a single entrypoint. What about dialogs?

- I have a working rollup build with hot reloading mostly working; getting another whole project involved and figuring out how to get it working with an already complex project would add a whole other dimension of complexity to the port.

- These might be opinionated about assets. This might be a good thing (could get rid of a lot of custom logic and protocol handlers if it Just Works) but could also be another source of friction.

On the pros side, these projects are more likely to be up-to-date with how Electron works these days (going from 22 to 35) and have likely put a lot of effort into making it work and getting good DX.

If getting the rollup build working is a pain anyway then it might be worth just taking the plunge.

### Svelte

Svelte 5. No runes in non-Svelte code atm. Migration in progress. Search for // MIGRATION and svelte/legacy.

### TypeScript

This project has been migrated from JS to TS, and in the initial change only the minimal required changes were applied to get the code to compile. The vast majority of the value for me is in convenience (90%) and the ability to write type annotations where that's the most natural way to express the concept (10%).

It may seem strange, but for the needs of this particular project (mostly single highly experienced author & maintainer, mostly for personal use---and specifically, that person is me), the type checking part of TypeScript isn't all that valuable and the friction of having to write and structure code in such a way that the compiler knows it's correct would be significant. No doubt type-related errors that the checker would have found will slip in from time to time, but in my experience---again, on this project specifically---those bugs are quick to surface and easy to fix. I can remember probably a handful of times in the last few years where I've spent more than ten minutes chasing down a typo (actual type-related mistakes being even fewer; I'm not sure I can remember one at all), but the increased verbosity and time spent refactoring to satisfy the type checker would be a consistent cost that just feels unnecessary for this project. If you want to write a usable IDE from scratch as a single dev, these are the kinds of pragmatic (and fun) decisions you have to make.

Further to this: I think the line might be: generics. Writing a generic is definitely a step change in the function of "how much it feels like I'm writing types" vs. how much it feels like I'm writing code. Simple type annotations feel like making the prose element of code more specific and clear, whereas generics feels like programming (as in dealing with all the abstract logical workings) in the language of the type checker.

## Installation & running

To install on Linux, run install/linux/install.sh (or uninstall.sh to uninstall). This will install a desktop entry so you can start from the menu and associate file types.

Other platforms not supported and adding them isn't a priority, but should be able to at least run in development mode and see a working app.

## Dev

For live reloading in Electron, the main process watches the build dir for changes and:

- for changes to the main process, reloads itself with `npm run restart`

- for changes to the renderer code, calls `.reload()` on each app and dialog window

The web version uses `rollup-plugin-live-reload`. This doesn't work with Edita's Electron setup, possibly because we use the custom `app:` protocol. It may be easy to just change this to `file:` or something, but I haven't got around to testing it.

### Scripts

Use `npm run dev` to start the app in development mode with live reloading.

It will default to using `.edita-dev` as the Chrome user data dir in dev mode, so it won't interfere with your existing Edita config if you use it as your editor.

Some scripts called by npm scripts require the PLATFORM environment variable to be set, to indicate which variant of the app we're working with (electron, web, or test).

The PLATFORM variable is used for:

- Rollup config, to avoid unnecessarily building everything if we're only developing on one of the variants.

- `await-build` and `build-clean`, which will complain if PLATFORM isn't present. These are just for convenience, so that we don't start building the app, launch it in parallel, and then have it reload when the build completes. Instead we always wait for the initial build before launching.

## Launch process

The launch process for the Electron app starts with `bootstrap.ts` in both dev and prod mode. This makes arg parsing consistent and bundles args and env vars into a JSON object for easy consumption by the main process.
