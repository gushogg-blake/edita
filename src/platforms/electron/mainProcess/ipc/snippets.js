let bluebird = require("bluebird");
let fs = require("../modules/fs");

module.exports = function(app) {
	return {
		async load() {
			return bluebird.map(fs(app.config.userDataDir, "snippets").glob("*.json"), node => node.readJson());
		},
		
		async update(id, snippet) {
			
		},
	};
}
