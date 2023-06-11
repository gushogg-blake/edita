let JsonStore = require("modules/JsonStore");

let migrations = {
	"1"(session) {
		if (session) {
			for (let details of session.tabs) {
				if (!details.folds) {
					details.folds = {};
				}
			}
		} else {
			return session;
		}
	},
};

module.exports = function() {
	let defaultSession = null;
	
	return new JsonStore("session", defaultSession, migrations);
}
