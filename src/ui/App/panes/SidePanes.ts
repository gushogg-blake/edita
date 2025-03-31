import Pane from "./Pane";

class SidePanes {
	constructor(app) {
		this.app = app;
		
		this.left = this.createPane("left");
		this.right = this.createPane("right");
	}
	
	createPane(side) {
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

export default SidePanes;
