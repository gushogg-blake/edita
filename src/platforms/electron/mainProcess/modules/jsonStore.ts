import {fs} from "utils/node";

export default function(app) {
	let {userDataDir} = app.config;
	let storesDir = fs(userDataDir, "stores");
	
	function getDir(name: string): any { // TYPE fs Node
		return storesDir.child(encodeURIComponent(name));
	}
	
	function getNode(name: string, key: string): any { // TYPE fs Node
		return getDir(name).child(encodeURIComponent(key)).withExt(".json");
	}
	
	return {
		notify(name: string, key: string, value: any | null, type: string) {
			app.sendToRenderers("jsonStore.update", name, key, value, type);
		},
		
		async load(name: string, key: string): Promise<any> /* TYPE could probs reference actual types */ {
			try {
				let node = getNode(name, key);
				
				if (!await node.exists()) {
					return null;
				}
				
				return await node.readJson();
			} catch (e) {
				console.log("Error loading JSON store: " + name + ", " + key);
				
				throw e;
			}
		},
		
		async update(name: string, key: string, data: string): Promise<void> {
			let node = getNode(name, key);
			
			if (!await node.exists()) {
				throw new Error("jsonStore.update: item doesn't exist: " + name + ", " + key);
			}
			
			await node.write(data);
			
			this.notify(name, key, JSON.parse(data).value, "update");
		},
		
		async create(name: string, key: string, data: string): Promise<void> {
			let node = getNode(name, key);
			
			if (await node.exists()) {
				throw new Error("jsonStore.create: item already exists: " + name + ", " + key);
			}
			
			await node.parent.mkdirp();
			await node.write(data);
			
			this.notify(name, key, JSON.parse(data).value, "create");
		},
		
		async createOrUpdate(name: string, key: string, data: string): Promise<void> {
			let node = getNode(name, key);
			
			if (await node.exists()) {
				await this.update(name, key, data);
			} else {
				await this.create(name, key, data);
			}
		},
		
		async delete(name: string, key: string): Promise<void> {
			let node = getNode(name, key);
			
			if (!await node.exists()) {
				throw new Error("jsonStore.delete: item doesn't exist: " + name + ", " + key);
			}
			
			await node.delete();
			
			this.notify(name, key, null, "delete");
		},
		
		async ls(name: string): Promise<string[]> {
			try {
				return (await getDir(name).ls()).map(node => decodeURIComponent(node.basename));
			} catch (e) {
				return [];
			}
		},
	};
}
