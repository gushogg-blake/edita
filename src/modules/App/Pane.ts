let Evented = require("utils/Evented");

class Pane extends Evented {
	constructor(position, size, visible) {
		super();
		
		this.position = position;
		this.size = size;
		this.visible = visible;
	}
	
	resize(diff) {
		this.size += diff;
		
		this.fire("update");
	}
	
	resizeAndSave(diff) {
		this.resize(diff);
		
		this.fire("save");
	}
	
	show() {
		this.setVisibility(true);
	}
	
	hide() {
		this.setVisibility(false);
	}
	
	toggle() {
		this.setVisibility(!this.visible);
	}
	
	setVisibility(visible) {
		this.visible = visible;
		
		this.fire("update");
		this.fire(visible ? "show" : "hide");
	}
}

module.exports = Pane;
