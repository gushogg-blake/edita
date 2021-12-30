module.exports = function(app) {
	return {
		load(e, name, key) {
			return app.loadJson(name, key);
		},
		
		async save(e, name, key, data) {
			data = JSON.parse(data);
			
			await app.saveJson(name, key, data);
			
			app.sendToRenderers("jsonStore.update", name, key, data.value);
		},
	};
}
