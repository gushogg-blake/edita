export default {
	get(key) {
		try {
			return JSON.parse(localStorage.getItem(key));
		} catch (e) {
			return null;
		}
	},
	
	set(key, data) {
		localStorage.setItem(key, JSON.stringify(data));
	},
	
	has(key) {
		return localStorage.getItem(key) !== null;
	},
	
	remove(key) {
		localStorage.removeItem(key);
	},
	
	keys() {
		return Object.keys(localStorage);
	},
};
