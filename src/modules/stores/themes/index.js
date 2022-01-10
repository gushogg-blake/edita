let bluebird = require("bluebird");
let JsonStore = require("modules/JsonStore");
let defaultThemes = require("./defaultThemes");

module.exports = async function() {
	let store = new JsonStore("themes");
	
	await bluebird.map(Object.entries(defaultThemes), async function([key, theme]) {
		if (!await store.load(key)) {
			await store.save(key, theme);
		}
	});
	
	return store;
}
