let bluebird = require("bluebird");
let JsonStore = require("modules/JsonStore");
let defaultThemes = require("./defaultThemes");

let migrations = {
	"11"(theme, key) {
		return defaultThemes[key] || undefined;
	},
};

module.exports = async function() {
	let store = new JsonStore("themes", null, migrations);
	
	await bluebird.map(Object.entries(defaultThemes), async function([key, theme]) {
		if (!await store.load(key) || platform.config.dev) {
			await store.save(key, theme);
		}
	});
	
	return store;
}
