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
		
		this.tools.on("selectTab", this.onSelectTopPaneTab.bind(this));
		this.output.on("selectTab", this.onSelectBottomPaneTab.bind(this));
	}
	
	get containerHeight() {
		if (this.top.visible && this.top.expanded) {
			return this.preferredSizes.totalWithTopExpanded;
		} else {
			return "auto";
		}
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
		this.top.visible = true;
		this.top.expanded = true;
		
		this.tools.show();
	}
	
	expandOutput() {
		this.bottom.visible = true;
		this.bottom.expanded = true;
		
		this.output.show();
	}
	
	collapseOutput() {
		this.bottom.expanded = false;
		
		this.output.hide();
	}
	
	//openFindAndReplace() {
	//	this.expandTools();
	//	this.expandOutput();
	//	
	//	this.fire("update");
	//}
	//
	//openRefactor() {
	//	this.expandTools();
	//	this.collapseOutput();
	//	
	//	this.fire("update");
	//}
	
	configure(expandTop, expandBottom) {
		if (expandTop) {
			this.expandTools();
		} else {
			this.collapseTools();
		}
		
		if (expandBottom) {
			this.expandOutput();
		} else {
			this.collapseOutput();
		}
		
		this.fire("update");
	}
	
	onSelectTopPaneTab(tab) {
		this.expandTools();
		this.setSizes();
		
		this.fire("update");
	}
	
	onSelectBottomPaneTab(tab) {
		this.expandOutput();
		this.setSizes();
		
		this.fire("update");
	}
	
	createPane(visible, expanded) {
		let pane = new TabPane(visible, expanded);
		
		return pane;
	}
	
	resizeTools(diff) {
		console.log(diff);
		console.log(this.containerHeight);
		console.log(this.bottom.size);
		console.log(this.top.size);
		if (this.containerHeight === "auto") {
			this.preferredSizes.bottomContents += diff;
			this.bottom.size = this.preferredSizes.bottomContents;
		} else {
			this.preferredSizes.totalWithTopExpanded += diff;
		}
		
		this.fire("update");
	}
	
	resizeAndSaveTools(diff) {
		this.resizeTools(diff);
		
		this.savePrefs();
	}
	
	resizeOutput(diff) {
		if (this.top.size === "auto") {
			this.preferredSizes.totalWithTopExpanded += diff;
		} else {
			this.preferredSizes.bottomContents += diff;
			this.bottom.size = this.preferredSizes.bottomContents;
		}
		
		this.fire("update");
	}
	
	resizeAndSaveOutput(diff) {
		this.resizeOutput(diff);
		
		this.savePrefs();
	}
	
	savePrefs() {
		let {top, bottom, preferredSizes} = this;
		
		base.setPref("panes.bottom", {
			top,
			bottom,
			preferredSizes,
		});
	}
}

module.exports = BottomPanes;
