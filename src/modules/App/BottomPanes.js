let Evented = require("utils/Evented");
let TabPane = require("./TabPane");

/*
bottom pane sizing

we store and calculate based on the desired total height when the top pane
(tools) is expanded. if the bottom pane is visible it takes up the remaining
space after auto-sizing the top pane; otherwise the top pane is ... this is
starting to sound a lot like flex-box....

BUT we also need a height for when it's just the bottom pane - and maybe this
should be a bit higher than it would be if the top pane was visible.

so we still need to store a bottom height, it just will only be used if the
top pane is collapsed or hidden.

preferredSizes: {
	totalWithTopExpanded: 500,
	bottomContentsWithTopCollapsedOrHidden: 200,
},

top: {
	visible: true,
	expanded: false,
},

bottom: {
	visible: true,
	expanded: true,
},

pane.on("save", () => {
	base.setPref("panes." + name + ".size", pane.size);
});

pane.on("show hide expand collapse", () => {
	base.setPref("panes." + name + ".visible", pane.visible);
});
*/

class BottomPanes extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		
		let {
			preferredSizes,
			top,
			bottom,
		} = base.getPref("panes.bottom");
		
		let topSize = bottom.visible && bottom.expanded ? "auto" : "fill";
		let bottomSize = top.visible && top.expanded ? "fill" : preferredSizes.bottomContentsWithTopCollapsedOrHidden;
		
		this.tools = this.createPane(topSize, top.visible, top.expanded);
		this.output = this.createPane(bottomSize, bottom.visible, bottom.expanded);
	}
	
	get containerHeight() {
		if (this.tools.visible && this.tools.expanded) {
			return this.preferredSizes.totalWithTopExpanded;
		} else {
			return "auto";
		}
	}
	
	showFindAndReplace() {
		/*
		get total height, set top pane height to auto, then set bottom pane
		height to (total - top pane total)
		*/
		
		this.tools.setSize("auto");
		
		
	}
	
	showRefactor() {
	}
	
	createPane(size, visible, expanded) {
		let pane = new TabPane(size, visible, expanded);
		
		
		
		return pane;
	}
	
	resizeTools(diff) {
		
	}
	
	resizeAndSaveTools(diff) {
		
	}
	
	resizeOutput(diff) {
		
	}
	
	resizeAndSaveOutput(diff) {
		
	}
}

module.exports = BottomPanes;
