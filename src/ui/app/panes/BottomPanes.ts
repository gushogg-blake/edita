import {Evented} from "utils";
import type {Prefs} from "base";
import type {App} from "ui/app";
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

type PaneConfiguration = {
	visible: boolean;
	expanded: boolean;
};

type TopPaneConfiguration = PaneConfiguration & {
	size: number | "auto" | "fill";
};

type BottomPaneConfiguration = PaneConfiguration & {
	size: number;
};

type PaneConfigurations = {
	top: TopPaneConfiguration,
	bottom: BottomPaneConfiguration;
};

type Panes = {
	tools: TabPane;
	output: TabPane;
};

export default class BottomPanes extends Evented<{
	update: void;
}> {
	private app: App;
	private panes: Panes;
	private paneConfigurations: PaneConfigurations;
	private preferredSizes: Prefs["panes"]["bottom"]["preferredSizes"];
	
	constructor(app: App) {
		super();
		
		this.app = app;
		
		let {
			preferredSizes,
			top,
			bottom,
		} = base.prefs.panes.bottom;
		
		this.paneConfigurations = {
			top: {
				visible: top.visible,
				expanded: top.expanded,
				size: null,
			},
			
			bottom: {
				visible: bottom.visible,
				expanded: bottom.expanded,
				size: null,
			},
		};
		
		this.panes = {
			tools: this.createPane(this.paneConfigurations.top),
			output: this.createPane(this.paneConfigurations.bottom),
		};
		
		this.preferredSizes = preferredSizes;
		
		this.setSizes();
		
		this.on("update", () => {
			this.panes.tools.resize();
			this.panes.output.resize();
			this.app.resize();
		});
	}
	
	init() {
		this.panes.tools.on("selectTab", this.onSelectTopPaneTab.bind(this));
		this.panes.output.on("selectTab", this.onSelectBottomPaneTab.bind(this));
		
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
		this.paneConfigurations.top.visible = !this.paneConfigurations.top.visible;
		
		this.setSizes();
		
		this.fire("update");
		
		this.savePrefs();
	}
	
	toggleOutput() {
		this.paneConfigurations.bottom.visible = !this.paneConfigurations.bottom.visible;
		
		this.setSizes();
		
		this.fire("update");
		
		this.savePrefs();
	}
	
	get containerHeight() {
		if (this.topVisibleAndExpanded) {
			if (this.paneConfigurations.top.size === "auto") {
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
		return this.paneConfigurations.top.visible && this.paneConfigurations.top.expanded;
	}
	
	get bottomVisibleAndExpanded() {
		return this.paneConfigurations.bottom.visible && this.paneConfigurations.bottom.expanded;
	}
	
	setSizes() {
		let topSize;
		let bottomSize;
		
		if (["find-and-replace:"].includes(this.panes.tools.selectedTab?.protocol)) {
			// fit contents
			topSize = "auto";
		} else {
			// use as much height as allowed by the pref
			// NOTE not sure exactly how this works now, it's a bit weird
			// the idea is to have two settings for the desired bottom
			// pane height, as you'll want it to be smaller if the top
			// pane is bigger (e.g. refactor)
			topSize = "fill";
		}
		
		if (this.topVisibleAndExpanded) {
			bottomSize = topSize === "fill" ? this.preferredSizes.bottomContentsWithTop : "fill";
		} else {
			bottomSize = this.preferredSizes.bottomContentsWithoutTop;
		}
		
		this.paneConfigurations.top.size = topSize;
		this.paneConfigurations.bottom.size = bottomSize;
	}
	
	expandTools() {
		this.paneConfigurations.top.visible = true;
		this.paneConfigurations.top.expanded = true;
		
		this.panes.tools.show();
	}
	
	collapseTools() {
		this.paneConfigurations.top.expanded = false;
		
		this.panes.tools.hide();
	}
	
	expandOutput() {
		this.paneConfigurations.bottom.visible = true;
		this.paneConfigurations.bottom.expanded = true;
		
		this.panes.output.show();
	}
	
	collapseOutput() {
		this.paneConfigurations.bottom.expanded = false;
		
		this.panes.output.hide();
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
		
		if (this.paneConfigurations.top.size === "auto") {
			this.paneConfigurations.bottom.visible = true;
			this.paneConfigurations.bottom.expanded = true;
		} else {
			this.paneConfigurations.bottom.expanded = false;
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
	
	createPane(state): TabPane {
		let pane = new TabPane(state);
		
		return pane;
	}
	
	resizeTools(diff: number) {
		if (this.paneConfigurations.top.expanded) {
			this.preferredSizes.totalWithTopExpanded += diff;
		} else {
			this.preferredSizes.bottomContentsWithoutTop += diff;
			this.paneConfigurations.bottom.size = this.preferredSizes.bottomContentsWithoutTop;
		}
		
		this.fire("update");
	}
	
	resizeAndSaveTools(diff: number) {
		this.resizeTools(diff);
		
		this.savePrefs();
	}
	
	resizeOutput(diff: number) {
		if (this.paneConfigurations.top.size === "auto" && this.topVisibleAndExpanded) {
			this.preferredSizes.totalWithTopExpanded += diff;
		} else {
			if (this.topVisibleAndExpanded) {
				this.preferredSizes.bottomContentsWithTop += diff;
				this.paneConfigurations.bottom.size = this.preferredSizes.bottomContentsWithTop;
			} else {
				this.preferredSizes.bottomContentsWithoutTop += diff;
				this.paneConfigurations.bottom.size = this.preferredSizes.bottomContentsWithoutTop;
			}
		}
		
		this.fire("update");
	}
	
	resizeAndSaveOutput(diff) {
		this.resizeOutput(diff);
		
		this.savePrefs();
	}
	
	savePrefs() {
		let {top, bottom} = this.paneConfigurations;
		let {preferredSizes} = this;
		
		base.setPref("panes.bottom", {
			top,
			bottom,
			preferredSizes,
		});
	}
}
