
export let projectRootFiles = [
	".git",
	"src",
	"license",
	"licence",
	"changelog",
	"contributing",
	"contributing.md",
	"cargo.toml",
	"package.json",
	"gradle.properties",
	"cmakelists.txt",
	"makefile",
	"composer.json",
	"rakefile",
	"gemfile",
];

export let alwaysIncludeDirInTabTitle = [
	"index.js",
	"index.ts",
	/^\+.*\.(js|ts|svelte)$/,
];
