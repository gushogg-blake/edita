/*
externals - needed for both main and renderer, to avoid bundling node
builtins.

included in the web build for config simplicity, even though it won't
be needed.

NOTE not sure if commonjs needs the ignore list now that externals is
doing it
*/

export let nodeIgnore = [
	"glob",
	"fs-extra",
	"electron",
	"electron-window-state",
	"chokidar",
	"yargs",
];

export let commonjsIgnore = [
	...nodeIgnore,
	"node:*",
];

export let externalsIgnore = [
	...nodeIgnore,
	/^node:/,
];
