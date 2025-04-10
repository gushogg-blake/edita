# Edita

Edita is a code editor combining novel features and interactions with a familiar GUI interface.

See [edita.vercel.app](//edita.vercel.app/) (WIP).

## Requirements

- A recent Node version.

- Bun is required to run the `build-parsers` script. You don't need to run this unless you want to rebuild the language grammar WASM files or add a new one.

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

## Why another editor? Why from scratch?

To explore solutions to what I see as fundamental issues with existing editors. The original reason was that Komodo Edit (but any editor; that's just the one I was using) didn't support structural or "block-level" edits. It seemed insane to me that in order to move a `<div>` somewhere else on the page, I had to tell my _code editor_ exactly the range of characters that described it, then drag and drop the text and clean up whitespace afterwards. Out of this frustration came Edita's AST mode, which is structure-aware and works with whole lines as opposed to characters.

I also just want something that works exactly how I want it to work. Other editors all seem to have various rough edges that aren't solvable by extensions or config. Tab snippets behaviour is a prime example.

This leads into another more general thing I've noticed, which is that the Tab key is overloaded, and priority is misplaced:

- The "original" function is to insert a single tab character, but that's hardly ever what's needed now.

- If there's a selection, we usually want to indent or dedent it.

- The other main use-case is snippets, where:

	- If the preceding word is a snippet abbreviation, we insert the snippet.
	
	- Once in a snippet, Tab goes to the next tabstop
	
	- This means that nested snippets aren't a thing: at least in Edita, you have to finish the first snippet before inserting more.

Something I've realised recently is that by relegating the original use-case to a more complex keystroke, we might be able to free up more Tab usages for more common functionality. I've been thinking lately that Tab and Shift-Tab should actually work more like they do in forms, as navigation commands. The things we'd be navigating between would be blocks of code. The waypoints would be (for a C-like language) after the opening `{` and after the closing `}`, so if you were in an `if` block, hitting Tab would put you after its closing `}`. Hitting Shift+Tab there would put you just after its opening `{`, where normal navigation or perhaps other new shortcuts could provide easy ways of going to a particular point within the block.

### Escape

Edita uses the Escape key to switch between normal mode and tree mode (the AST/block-aware mode). You can either hold it as a modifier to "peek" into AST mode, or press it to switch for a longer sequence of commands.

All that is to say that in order to explore rethinking some of these things, it seemed necessary to start from a blank slate and have full control over the interface. Edita's handling of the Escape key in particular goes against the grain of deep assumptions built into other editors' interfaces, and I didn't want to constantly be fighting those assumptions.

### General

There are a few more general things that would be hard to integrate into an existing editor. VS Code, for example, uses Electron's (Chrome's) context and file menus, which are not as snappy and smooth as the native ones (on Linux Mint Mate at least). I think it's important to have full control over _all_ interactions to avoid small but annoying rough edges like these, so Edita uses custom context menus that are copied from Mate's.

### Philosophy

I'm fascinated by the prospect of a fully-fledged IDE that's just a single repo (not even a monorepo) with a handful of dependencies, and that you can download and run in dev mode with `git clone; npm i; npm run dev` -- no native code to build, no complex project structure to understand. Tree-sitter and LSP bring this within reach (although language servers will have to be bundled somehow as native binaries, where not written in JavaScript).

## Project status

I'm currently working on a code overhaul (port to TypeScript; big refactor) and performance and reliability issues to get Edita to a point where I would feel good about recommending that people try it. As of now I've been using it as my daily driver for over 3 years, but there are bugs (I encountered several unrecoverable freezes from the Markdown grammar WASM module while writing this, and have switched to xed -- other grammars seem more stable) and I don't know how approachable the UI is -- I've written it around my needs by necessity, so it's probably covered in rough edges and not discoverable at all for new users.

## High-level overview of the code

This project is based on Electron, which allows you to write a web app and package it as a desktop application (it runs a version of the Chromium browser that communicates with a Node process, both of which have access to Electron APIs).

So it's mostly a web app, and there is a fully working web version that uses e.g. IndexedDB in place of the actual filesystem for saving files. Platform specific code is in src/platforms, and "platform" in this sense just means "Electron or web", not Linux/another OS. Within the Electron (desktop) platform code, I have mostly tried to stick to using e.g. `path.sep` instead of assuming Linux, but I am biased towards Linux. I have mostly marked platform assumptions with `// PLATFORM` comments.

It doesn't use a drop-in code editor component, or even `textarea` or `contenteditable`: all the functionality of basic text editing is implemented from the ground up.

The UI is written in Svelte 5. For syncing up the data with the UI, I follow a simple but repetitive pattern of duplicating relevant app state in the Svelte components and wiring up event handlers to update them. (No runes in ts files).

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

Note: Electron now strongly discourages using `ipcRenderer` directly from the renderer and instead recommends preload scripts. We are still using nodeIntegration and require()ing electron imports directly from the renderer for now. We don't load any remote scripts, but `nodeIntegration` still opens us up to supply chain attacks from client-side dependencies whereas otherwise we'd only have to worry about the main process.

### Building

Rollup.

### Strict null checking & optionality

I'm used to using `null` but TS seems to prefer `undefined` in that optionality is `type | undefined` and with `--strictNullChecking` you can't put `null` there. For now I'm using optionality (`var?: type`) to indicate that something can be null, and initialising it to null where appropriate. Later, if `--strictNullChecking` is turned on, it should be fairly easy to update all the logic to use `undefined` as the null value and remove the `null` initialisations.

#### Examples:

```typescript
class A {
	// should always be non-null after class has done its initialisation
	private variableWidthPart: VariableWidthPart = null;
	// can be null
	private lastRenderedLineIndex?: number = null;
}
```

## Launch process

The launch process for the Electron app starts with `bootstrap.ts` in both dev and prod mode. This makes arg parsing consistent and bundles args and env vars into a JSON object for easy consumption by the main process.
