Treefrog
===

Treefrog is a platform for prototyping novel interaction designs for code editing.  It's also a fully-fledged standard code editor with syntax highlighting, find/replace, and snippets.

Treefrog runs on Electron and the web.  Platform-specific code (as in web vs Electron, not Windows/Mac/Linux) is in [src/platforms](./src/platforms).

Project structure
---

The main code for Treefrog is in [src/modules](./src/modules).  These constitute the business logic, including some aspects of rendering (see e.g. [src/modules/View/renderCodeAndMargin.js](./src/modules/View/renderCodeAndMargin.js), which coordinates with [src/components/Editor/canvas/render.js](./src/components/Editor/canvas/render.js) to render the code and margin).

The UI is written in Svelte and is in [src/components](./src/components).  The app is decoupled from the UI and can run without it, with the UI being added later -- all communication to the UI that's initiated by the app is done by events, and the UI can render an app in any initial state.

This project uses the [ENTRYPOINT](https://gist.github.com/gushogg-blake/247b1bf2ed46b035d1c8a2c1e776b607) convention -- comments that start with `// ENTRYPOINT` indicate top-level entry points to .
