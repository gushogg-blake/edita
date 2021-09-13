module.exports = {
	get(key) {
		try {
			return JSON.parse(localStorage.get(key));
		} catch (e) {
			return null;
		}
	},
	
	set(key, data) {
		localStorage.set(key, JSON.stringify(data));
	},
};
