let Evented = require("utils/Evented");

class Pane extends Evented {
	constructor(name, position=name) {
		super();
		
		this.name = name;
		this.position = position;
		
		let {
			size,
			visible,
		} = base.getPref("panes." + name);
		
		this.size = size;
		this.visible = visible;
		this.stackedAbove = null;
	}
	
	get totalSize() {
		let {size} = this;
		
		this.fire("requestTotalSize", function(s) {
			size = s;
		});
		
		return size;
	}
	
	get paneBelowSize() {
		return this.stackedAbove?.totalSize || 0;
	}
	
	resize(size) {
		this.size = size;
		
		this.fire("update");
	}
	
	resizeAndSave(size) {
		this.resize(size);
		
		base.setPref("panes." + this.name + ".size", size);
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
		
		base.setPref("panes." + this.name + ".visible", visible);
		
		this.fire(visible ? "show" : "hide");
	}
	
	stackAbove(pane) {
		this.stackedAbove = pane;
		
		pane.on("update", () => this.fire("update"));
	}
	
	uiMounted() {
		this.fire("update");
	}
}

module.exports = Pane;
