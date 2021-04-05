module.exports = class {
	constructor() {
		this._handlers = {};
	}
	
	on(events, handler) {
		events = events.split(" ");
		
		for (let e of events) {
			if (!this._handlers[e]) {
				this._handlers[e] = [];
			}
			
			this._handlers[e].push(handler);
		}
		
		return () => {
			for (let e of events) {
				removeInPlace(this._handlers[e], handler);
				
				if (this._handlers[e].length === 0) {
					delete this._handlers[e];
				}
			}
		}
	}
	
	fire(event, ...args) {
		if (!this._handlers[event]) {
			return;
		}
		
		for (let handler of this._handlers[event]) {
			handler(...args);
		}
	}
}
