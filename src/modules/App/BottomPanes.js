let TabPane = require("./TabPane");

class BottomPanes {
	constructor(app) {
		this.app = app;
		
		this.tools = this.createPane("bottom1");
		this.output = this.createPane("bottom2");
		
		let {totalHeight, topHeight} = base.getPref("panes.bottom");
	}
	
	showFindAndReplace() {
		/*
		get total height, set top pane height to auto, then set bottom pane
		height to (total - top pane total)
		*/
		
		this.tools.setSize("auto");
		
		
	}
	
	createPane(name) {
		
		let pane = new TabPane( size, visible, expanded);
		
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
