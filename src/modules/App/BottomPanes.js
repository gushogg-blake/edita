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

the top pane is auto sized (grows to fit content) for find and replace, as it
doesn't have any space-filling elements.

if the top pane is auto sized, the bottom pane fills any available space.

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
		
		this.tools = this.createPane();
		this.output = this.createPane();
		
		this.top = {
			visible: top.visible,
			expanded: top.expanded,
			size: null,
		};
		
		this.bottom = {
			visible: bottom.visible,
			expanded: bottom.expanded,
			size: null,
		};
		
		this.preferredSizes = preferredSizes;
		
		this.setSizes();
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
	
	setSizes() {
		let {top, bottom} = this;
		
		let topSize;
		let bottomSize;
		
		if (["findAndReplace"].includes(this.tools.selectedTab?.type)) { // TODO tools will always have f/r
			topSize = "auto";
		} else {
			topSize = "fill";
		}
		
		if (top.visible && top.expanded) {
			bottomSize = topSize === "fill" ? this.preferredSizes.bottomContents : "fill";
		} else {
			bottomSize = this.preferredSizes.bottomContents;
		}
		
		this.top.size = topSize;
		this.bottom.size = bottomSize;
	}
	
	expandTools() {
		this.tools.show();
		this.tools.expand();
		this.tools.setSize("fill");
		this.output.setSize(this.preferredSizes.bottomContents);
	}
	
	showRefactor() {
		this.expandTools();
		this.fire("update");
	}
	
	onSelectTopPaneTab(tab) {
		if (["findAndReplace"].includes(tab.type)) {
			this.tools.setSize("auto");
			this.output.setSize("fill");
		} else {
			this.tools.setSize("fill");
			this.output.setSize(this.preferredSizes.bottomContents);
		}
	}
	
	createPane(visible, expanded) {
		let pane = new TabPane(visible, expanded);
		
		pane.on("selectTab", this.onSelectTab.bind(this));
		
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
