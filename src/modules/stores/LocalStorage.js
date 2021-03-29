let Writable = require("./Writable");

module.exports = class extends Writable {
	constructor(key, value, version, migrate) {
		let existingValue;
		
		try {
			let existing = JSON.parse(localStorage.getItem(key));
			
			if (existing.version && (!version || existing.version === version)) {
				existingValue = existing.value;
			} else if (migrate && migrate[existing.version]) {
				existingValue = migrate[existing.version](existing.value);
			} else if (migrate && migrate["*"]) {
				existingValue = migrate["*"](existing.value);
			} else {
				existingValue = null;
			}
		} catch (e) {
			existingValue = null;
			
			localStorage.setItem(key, "null");
		}
		
		value = existingValue || value;
		
		super(value);
		
		this.version = version;
		this.key = key;
		this._store();
	}
	
	_store() {
		localStorage.setItem(this.key, JSON.stringify({
			version: this.version || "1",
			value: this.value,
		}));
	}
	
	set(value) {
		super.set(value);
		
		this._store();
	}
	
	update(obj) {
		this.set({
			...this.value,
			...obj,
		});
	}
	
	clear() {
		localStorage.removeItem(this.key);
	}
}
