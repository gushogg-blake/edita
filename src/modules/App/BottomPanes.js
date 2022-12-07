let Evented = require("utils/Evented");

class BottomPanes {
	constructor() {
		super();
		
		this.tools = this.createPane("bottom1");
		this.output = this.createPane("bottom2");
	}
	
	showFindAndReplace() {
		/*
		get total height, set top pane height to auto, then set bottom pane
		height to (total - top pane total)
		*/
		
		this.tools.setSize("auto");
		
		
	}
	
	createPane(name) {
		let {size, visible, expanded} = base.getPref("panes." + name);
		
		let pane = new Pane(name, size, visible, expanded);
		
		pane.on("save", () => {
			base.setPref("panes." + name + ".size", pane.size);
		});
		
		pane.on("show hide expand collapse", () => {
			base.setPref("panes." + name + ".visible", pane.visible);
		});
		
		return pane;
	}
}

module.exports = BottomPanes;
