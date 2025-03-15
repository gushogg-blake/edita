let {fs} = require("utils/node/index");

export default function(app) {
	function jsonStorageKey(name, key) {
		let path = [encodeURIComponent(name)];
		
		if (key) {
			path.push(encodeURIComponent(key));
		}
		
		return path;
	}
	
	let {userDataDir} = app.config;
	
	return {
		async load(name, key) {
			try {
				let node = fs(userDataDir, ...jsonStorageKey(name, key)).withExt(".json");
				
				if (!await node.exists()) {
					return null;
				}
				
				return await node.readJson();
			} catch (e) {
				console.log("Error loading JSON store: " + name + (key ? ", " + key : ""));
				
				throw e;
			}
		},
		
		async save(name, key, data) {
			data = JSON.parse(data);
			
			let node = fs(userDataDir, ...jsonStorageKey(name, key)).withExt(".json");
			
			await node.parent.mkdirp();
			await node.writeJson(data);
			
			app.sendToRenderers("jsonStore.update", name, key, data.value);
		},
		
		async ls(name) {
			try {
				return (await fs(userDataDir, encodeURIComponent(name)).ls()).map(node => decodeURIComponent(node.basename));
			} catch (e) {
				return [];
			}
		},
	};
}
