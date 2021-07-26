let langs = {};

module.exports = {
	add(lang) {
		langs[lang.code] = lang;
	},
	
	get(code) {
		return langs[code] || null;
	},
	
	get all() {
		return Object.values(langs);
	},
};
