let Pane = require("./Pane");

class SidePanes {
	constructor(app) {
		this.left = this.createPane("left");
		this.right = this.createPane("right");
	}
	
	createPane(side) {
		let {
			size,
			visible,
		} = base.getPref("panes." + side);
		
		let pane = new Pane(side, size, visible);
		
		pane.on("save", () => {
			base.setPref("panes." + side + ".size", pane.size);
		});
		
		pane.on("show hide", () => {
			base.setPref("panes." + side + ".visible", pane.visible);
		});
		
		return pane;
	}
}

module.exports = SidePanes;
