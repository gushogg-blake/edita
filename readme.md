Edita
===

Edita is a code editor combining novel features and interactions with a familiar GUI interface.

See [edita.vercel.app](//edita.vercel.app/).
---

The main code for Edita is in [src/modules](./src/modules). These constitute the business logic, including some aspects of rendering (see e.g. [View/render/CodeRenderer.js](./src/modules/View/render/CodeRenderer.js), which coordinates with [src/components/Editor/canvas/renderCode.js](./src/components/Editor/canvas/renderCode.js) to render the code).

The UI is written in Svelte and is in [src/components](./src/components). The app is decoupled from the UI and can run without it, with the UI being added later (all communication to the UI that's initiated by the app is done by events, and the UI can render an app in any initial state).

Edita runs on Electron and the web. Platform-specific code is in [src/platforms](./src/platforms).

This project uses the [ENTRYPOINT](https://gitlab.com/-/snippets/2431100) convention -- comments that start with `// ENTRYPOINT` indicate top-level entry points such as the `main` function and event handlers.
