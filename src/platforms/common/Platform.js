let Evented = require("utils/Evented");
let lspConfig = require("./modules/lspConfig");

class Platform extends Evented {
	constructor() {
		super();
	}
	
	confirm(message) {
		return confirm(message);
	}
	
	startLspServer(key, langCode, options) {
		let capabilities = lspConfig.capabilities[langCode];
		
		options = {
			capabilities,
			...options,
			
			initializationOptions: {
				...lspConfig.initializationOptions[langCode],
				...options.initializationOptions,
			},
		};
		
		return this.lsp.start(key, langCode, options);
	}
}

module.exports = Platform;
