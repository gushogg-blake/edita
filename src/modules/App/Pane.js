let Evented = require("utils/Evented");

class Pane extends Evented {
	constructor(position) {
		super();
		
		this.position = position;
		
		let {
			size,
			show,
		} = platform.getPref("panes." + position);
		
		this.size = size;
		this.show = show;
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
		this.setVisibility(!this.show);
	}
	
	setVisibility(show) {
		this.show = show;
		
		platform.setPref("panes." + this.position + ".show", show);
		
		this.fire(show ? "show" : "hide");
	}
}

module.exports = Pane;
