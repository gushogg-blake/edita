import bluebird from "bluebird";
import {JsonStore} from "base/stores";
import type {Theme} from "base";
import defaultThemes from "./defaultThemes";
import migrations from "./migrations";

export default async function() {
	let store = new JsonStore<Theme>("themes", null, migrations);
	
	await bluebird.map(Object.entries(defaultThemes), async function([key, theme]) {
		if (!await store.load(key) || platform.config.dev) {
			await store.createOrUpdate(key, theme);
		}
	});
	
	return store;
}
