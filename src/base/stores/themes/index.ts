import bluebird from "bluebird";
import JsonStore from "base/stores/JsonStore";
import defaultThemes from "./defaultThemes";

let migrations = {
	"18"(theme, key) {
		return defaultThemes[key] || undefined;
	},
};

export default async function() {
	let store = new JsonStore("themes", null, migrations);
	
	await bluebird.map(Object.entries(defaultThemes), async function([key, theme]) {
		if (!await store.load(key) || platform.config.dev) {
			await store.save(key, theme);
		}
	});
	
	return store;
}
