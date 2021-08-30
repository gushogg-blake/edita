module.exports = function(app) {
	return {
		load() {
			return app.loadJson("session");
		},
		
		save(e, session) {
			return app.saveJson("session", session);
		},
	};
}
