let Evented = require("utils/Evented");

class Platform extends Evented {
	constructor() {
		super();

		this.focusStack = []; // for synthetic versions of things that would usually take focus away natively, e.g. context menus
	}

	addToFocusStack(item) {
		this.focusStack.push(item);
		
		this.fire("focusStackChanged", this.focusStack);
	}
	
	removeFromFocusStack(item) {
		this.focusStack = this.focusStack.filter(i => i !== item);
		
		this.fire("focusStackChanged", this.focusStack);
	}
	
	get focusStackItem() {
		return this.focusStack[this.focusStack.length - 1] || null;
	}
}

module.exports = Platform;
