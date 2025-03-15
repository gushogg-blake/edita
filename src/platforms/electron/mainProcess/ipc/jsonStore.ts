export default function(app) {
	return {
		load(e, name, key) {
			return app.jsonStore.load(name, key);
		},
		
		save(e, name, key, data) {
			return app.jsonStore.save(name, key, data);
		},
		
		ls(e, name) {
			return app.jsonStore.ls(name);
		},
	};
}
