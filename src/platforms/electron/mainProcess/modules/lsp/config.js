module.exports = {
	typescript(app) {
		let nodeModules = app.rootDir.child("node_modules");
		
		return {
			command: [
				"node",
				"--inspect=6000",
				nodeModules.child("typescript-language-server", "lib", "cli.js").path,
				"--stdio",
				"--log-level=4",
			],
			
			setInitializeParams(initializeParams) {
				initializeParams.initializationOptions = {
					...initializeParams.initializationOptions,
					
					tsserver: {
						path: nodeModules.child("typescript/lib/tsserver.js").path,
						logVerbosity: "verbose",
					},
				};
			},
		};
	},
};
