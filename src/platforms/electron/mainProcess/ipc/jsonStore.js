let fs = require("../modules/fs");

module.exports = function(app) {
	function jsonStorageKey(name, key) {
		return key ? name + "/" + key : name;
	}
	
	let {userDataDir} = app.config;
	
	return {
		async load(e, name, key) {
			try {
				return await fs(userDataDir, ...jsonStorageKey(name, key).split("/")).withExt(".json").readJson() || null;
			} catch (e) {
				return null;
			}
		},
		
		async save(e, name, key, data) {
			data = JSON.parse(data);
			
			let node = fs(userDataDir, ...jsonStorageKey(name, key).split("/")).withExt(".json");
			
			await node.parent.mkdirp();
			await node.writeJson(data);
			
			app.sendToRenderers("jsonStore.update", name, key, data.value);
		},
		
		async ls(e, name) {
			try {
				return (await fs(userDataDir, name).ls()).map(node => node.basename);
			} catch (e) {
				return [];
			}
		},
	};
}
