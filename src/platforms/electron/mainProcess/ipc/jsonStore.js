module.exports = function(app) {
	return {
		load(e, key) {
			return app.loadJson(key);
		},
		
		async save(e, key, data) {
			await app.saveJson(key, data);
			
			app.sendToRenderers("jsonStore", "update", key, data);
		},
	};
}
