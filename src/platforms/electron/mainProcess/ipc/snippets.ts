let bluebird = require("bluebird");
let {fs, lid} = require("utils/node/index");

export default function(app) {
	let snippetsDir = fs(app.config.userDataDir, "snippets");
	
	function generateFilename(snippet) {
		let {id, name, langs, langGroups} = snippet;
		
		langs = langs.join("-");
		langGroups = langGroups.join("-");
		
		return [langGroups, langs, name, id].filter(Boolean).join("-") + ".json";
	}
	
	async function getNode(id) {
		return (await snippetsDir.glob("*.json")).find(node => node.basename.endsWith("-" + id));
	}
	
	return {
		async load() {
			return bluebird.map(snippetsDir.glob("*.json"), node => node.readJson());
		},
		
		async create(e, snippet) {
			snippet = {
				...snippet,
				id: lid(),
			};
			
			let node = snippetsDir.child(generateFilename(snippet));
			
			await node.writeJson(snippet);
			
			app.sendToRenderers("snippets/new", snippet);
			
			return snippet.id;
		},
		
		async update(e, id, snippet) {
			snippet = {id, ...snippet};
			
			let node = await getNode(id);
			
			if (!node) {
				return;
			}
			
			await node.writeJson(snippet);
			
			app.sendToRenderers("snippets/update", id, snippet);
		},
		
		async delete(e, id) {
			let node = await getNode(id);
			
			if (!node) {
				return;
			}
			
			await node.delete();
			
			app.sendToRenderers("snippets/delete", id);
		},
	};
}
