import {Evented} from "utils";
import TabPane from "./TabPane";

/*
bottom pane sizing

container height:

- if the top pane is visible and expanded, this is set to
preferredSizes.totalWithTopExpanded - unless the top pane height
is auto and the bottom pane is collapsed or hidden, in which case
it is auto.

- if only the bottom pane is visible, its height is set to
preferredSizes.bottomContentsWithoutTop and the container height is
auto.

top pane height:

- depending on the tab type, this is auto (fit contents) or fill
(flex-grow: 1). if it is auto, the bottom pane is set to fill.

bottom pane height:

- two prefs are stored for this, one for when the top pane is visible
and expanded and one for when it's not. the appropriate one of these is
used unless the height is "fill" from the above rule.
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
		
		this.tools = this.createPane(this.top);
		this.output = this.createPane(this.bottom);
		
		this.preferredSizes = preferredSizes;
		
		this.setSizes();
		
		this.on("update", () => {
			this.tools.resize();
			this.output.resize();
			this.app.resize();
		});
	}
	
	init() {
		this.tools.on("selectTab", this.onSelectTopPaneTab.bind(this));
		this.output.on("selectTab", this.onSelectBottomPaneTab.bind(this));
		
		this.setSizes();
		
		this.fire("update");
	}
	
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
		
		this.setSizes();
		
		this.fire("update");
	}
	
	toggleTools() {
		this.top.visible = !this.top.visible;
		
		this.setSizes();
		
		this.fire("update");
		
		this.savePrefs();
	}
	
	toggleOutput() {
		this.bottom.visible = !this.bottom.visible;
		
		this.setSizes();
		
		this.fire("update");
		
		this.savePrefs();
	}
	
	get containerHeight() {
		if (this.topVisibleAndExpanded) {
			if (this.top.size === "auto") {
				if (this.bottomVisibleAndExpanded) {
					return this.preferredSizes.totalWithTopExpanded;
				} else {
					return "auto";
				}
			} else {
				return this.preferredSizes.totalWithTopExpanded;
			}
		} else {
			return "auto";
		}
	}
	
	get topVisibleAndExpanded() {
		return this.top.visible && this.top.expanded;
	}
	
	get bottomVisibleAndExpanded() {
		return this.bottom.visible && this.bottom.expanded;
	}
	
	setSizes() {
		let topSize;
		let bottomSize;
		
		if (["findAndReplace"].includes(this.tools.selectedTab?.type)) {
			topSize = "auto";
		} else {
			topSize = "fill";
		}
		
		if (this.topVisibleAndExpanded) {
			bottomSize = topSize === "fill" ? this.preferredSizes.bottomContentsWithTop : "fill";
		} else {
			bottomSize = this.preferredSizes.bottomContentsWithoutTop;
		}
		
		this.top.size = topSize;
		this.bottom.size = bottomSize;
	}
	
	expandTools() {
		this.top.visible = true;
		this.top.expanded = true;
		
		this.tools.show();
	}
	
	collapseTools() {
		this.top.expanded = false;
		
		this.tools.hide();
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
	
	onSelectTopPaneTab(tab) {
		this.expandTools();
		this.setSizes();
		
		if (this.top.size === "auto") {
			this.bottom.visible = true;
			this.bottom.expanded = true;
		} else {
			this.bottom.expanded = false;
		}
		
		this.fire("update");
		
		this.savePrefs();
	}
	
	onSelectBottomPaneTab(tab) {
		this.expandOutput();
		this.setSizes();
		
		this.fire("update");
		
		this.savePrefs();
	}
	
	createPane(state) {
		let pane = new TabPane(state);
		
		return pane;
	}
	
	resizeTools(diff) {
		if (this.top.expanded) {
			this.preferredSizes.totalWithTopExpanded += diff;
		} else {
			this.preferredSizes.bottomContentsWithoutTop += diff;
			this.bottom.size = this.preferredSizes.bottomContentsWithoutTop;
		}
		
		this.fire("update");
	}
	
	resizeAndSaveTools(diff) {
		this.resizeTools(diff);
		
		this.savePrefs();
	}
	
	resizeOutput(diff) {
		if (this.top.size === "auto" && this.topVisibleAndExpanded) {
			this.preferredSizes.totalWithTopExpanded += diff;
		} else {
			if (this.topVisibleAndExpanded) {
				this.preferredSizes.bottomContentsWithTop += diff;
				this.bottom.size = this.preferredSizes.bottomContentsWithTop;
			} else {
				this.preferredSizes.bottomContentsWithoutTop += diff;
				this.bottom.size = this.preferredSizes.bottomContentsWithoutTop;
			}
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

export default BottomPanes;
