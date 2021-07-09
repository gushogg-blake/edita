let langs = {};

module.exports = {
	add(name, lang) {
		langs[name] = lang;
	},
	
	get(name) {
		return langs[name] || null;
	},
};
