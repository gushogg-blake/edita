module.exports = function(app) {
	return {
		load() {
			return app.loadJson("prefs");
		},
		
		async save(e, prefs) {
			await app.saveJson("prefs", prefs);
			
			app.callRenderers("prefs/update", prefs);
		},
	};
}
