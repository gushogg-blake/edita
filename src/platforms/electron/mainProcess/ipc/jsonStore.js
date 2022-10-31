let fs = require("../modules/fs");

module.exports = function(app) {
	function jsonStorageKey(name, key) {
		let path = [encodeURIComponent(name)];
		
		if (key) {
			path.push(encodeURIComponent(key));
		}
		
		return path;
	}
	
	let {userDataDir} = app.config;
	
	return {
		async load(e, name, key) {
			try {
				return await fs(userDataDir, ...jsonStorageKey(name, key)).withExt(".json").readJson() || null;
			} catch (e) {
				return null;
			}
		},
		
		async save(e, name, key, data) {
			data = JSON.parse(data);
			
			let node = fs(userDataDir, ...jsonStorageKey(name, key)).withExt(".json");
			
			await node.parent.mkdirp();
			await node.writeJson(data);
			
			app.sendToRenderers("jsonStore.update", name, key, data.value);
		},
		
		async ls(e, name) {
			try {
				return (await fs(userDataDir, encodeURIComponent(name)).ls()).map(node => decodeURIComponent(node.basename));
			} catch (e) {
				return [];
			}
		},
	};
}
