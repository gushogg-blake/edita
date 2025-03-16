export default {
	alias() {
		// SYNC keep these in sync with tsconfig.json
		return alias({
			entries: {
				"root": root,
				"components": path.join(root, "src/components"),
				"modules": path.join(root, "src/modules"),
				"utils": path.join(root, "src/utils"),
				"platforms": path.join(root, "src/platforms"),
				"vendor": path.join(root, "vendor"),
				"test": path.join(root, "test"),
			},
		});
	},
	
	resolve(opts={}) {
		return resolve({
			extensions: [".js", ".ts", ".svelte"],
			...opts,
		});
	},
	
	typescript(opts={}) {
		return typescript({
			compilerOptions: {
				// going by https://www.typescriptlang.org/tsconfig/#module
				// which says we probably want esnext for bundled code
				// this affects the kind of import/export statements that
				// are emitted
				module: "esnext",
				...opts,
			},
		});
	},
	
	externals() {
		return externals({
			// it can add/strip the node: prefix -- don't want to mess with them
			builtinsPrefix: "ignore",
			
			// defaults to making all non-dev deps external
			deps: false,
			peerDeps: false,
			optDeps: false,
			
			include: externalsIgnore,
		});
	},
};
