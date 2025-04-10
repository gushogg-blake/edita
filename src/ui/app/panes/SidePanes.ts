import type {App} from "ui/app";
import {type Side, Pane} from "ui/app/panes";

export default class SidePanes {
	left: Pane;
	right: Pane;
	
	private app: App;
	
	constructor(app: App) {
		this.app = app;
		
		this.left = this.createPane("left");
		this.right = this.createPane("right");
	}
	
	createPane(side: Side) {
		let {size, visible} = base.getPref("panes." + side);
		
		let pane = new Pane(side, size, visible);
		
		pane.on("save", () => {
			base.setPref("panes." + side + ".size", pane.size);
		});
		
		pane.on("show", () => {
			base.setPref("panes." + side + ".visible", pane.visible);
		});
		
		pane.on("hide", () => {
			base.setPref("panes." + side + ".visible", pane.visible);
		});
		
		pane.on("update", () => {
			this.app.resize();
		});
		
		return pane;
	}
}
