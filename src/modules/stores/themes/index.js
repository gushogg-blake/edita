let bluebird = require("bluebird");
let JsonStore = require("modules/JsonStore");
let defaultThemes = require("./defaultThemes");

let migrations = {
	"1"(theme, key) {
		if (key !== "dark") {
			return;
		}
		
		let color = "#e8f8fd";
		
		theme.langs.css.color = color;
		theme.langs.css.text = color;
		
		theme.langs.scss.color = color;
		theme.langs.scss.text = color;
	},
	
	"2"(theme, key) {
		if (key !== "dark") {
			return;
		}
		
		let color = "#e8f8fd";
		
		theme.langs.css.number = color;
		
		theme.langs.scss.number = color;
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
