let Evented = require("utils/Evented");

module.exports = class extends Evented {
	constructor(localStoragePrefix) {
		super();
	}
	
	findByLangAndName(lang, name) {
		return null; //
	}
	
	all() {
		return []; //
	}
}

