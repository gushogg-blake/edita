export default function(app) {
	return {
		load(e, name, key) {
			return app.jsonStore.load(name, key);
		},
		
		update(e, name, key, data) {
			return app.jsonStore.update(name, key, data);
		},
		
		create(e, name, key, data) {
			return app.jsonStore.create(name, key, data);
		},
		
		createOrUpdate(e, name, key, data) {
			return app.jsonStore.createOrUpdate(name, key, data);
		},
		
		delete(e, name, key) {
			return app.jsonStore.delete(name, key);
		},
		
		ls(e, name) {
			return app.jsonStore.ls(name);
		},
	};
}
