let Evented = require("utils/Evented");

class Pane extends Evented {
	constructor(position, contents=null) {
		super();
		
		this.position = position;
		
		let {
			size,
			visible,
		} = base.getPref("panes." + position);
		
		this.size = size;
		this.visible = visible;
	}
	
	get totalSize() {
		let {size} = this;
		
		this.fire("requestTotalSize", function(s) {
			size = s;
		});
		
		return size;
	}
	
	resize(size) {
		this.size = size;
		
		this.fire("resize");
	}
	
	resizeAndSave(size) {
		this.resize(size);
		
		base.setPref("panes." + this.position + ".size", size);
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
		
		base.setPref("panes." + this.position + ".visible", visible);
		
		if (this.contents?.setVisibility) {
			this.contents.setVisibility(visible);
		}
		
		this.fire(visible ? "show" : "hide");
	}
}

module.exports = Pane;
