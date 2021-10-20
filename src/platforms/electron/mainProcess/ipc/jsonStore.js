module.exports = function(app) {
	return {
		load(e, key, _default=null) {
			return app.loadJson(key, _default);
		},
		
		async save(e, key, data) {
			data = JSON.parse(data);
			
			await app.saveJson(key, data);
			
			app.sendToRenderers("jsonStore.update", key, data);
		},
	};
}
