module.exports = {
	requestTimeout: 5000,
	
	perLang: {
		typescript(app) {
			let nodeModules = app.rootDir.child("node_modules");
			
			return {
				command: [
					"node",
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
							//trace: "verbose",
						},
					};
				},
			};
		},
	},
};
