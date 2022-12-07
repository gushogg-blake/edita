let Evented = require("utils/Evented");

class Pane extends Evented {
	constructor(position, size, visible) {
		super();
		
		this.position = position;
		this.size = size;
		this.visible = visible;
	}
	
	resize(size) {
		this.size = size;
		
		this.fire("update");
	}
	
	resizeAndSave(size) {
		this.resize(size);
		
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
