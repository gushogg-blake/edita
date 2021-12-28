let Evented = require("utils/Evented");

class Pane extends Evented {
	constructor(position) {
		super();
		
		this.position = position;
		
		let {
			size,
			visible,
		} = platform.getPref("panes." + position);
		
		this.size = size;
		this.visible = visible;
	}
	
	resize(size) {
		this.size = size;
		
		this.fire("resize");
	}
	
	resizeAndSave(size) {
		this.resize(size);
		
		platform.setPref("panes." + this.position + ".size", size);
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
		
		platform.setPref("panes." + this.position + ".visible", visible);
		
		this.fire(visible ? "show" : "hide");
	}
}

module.exports = Pane;
