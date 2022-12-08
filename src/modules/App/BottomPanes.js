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
*/

class BottomPanes {
	constructor(app) {
		this.app = app;
		
		let {
			totalHeight,
			toolsHeight,
			tools,
			output,
		} = base.getPref("panes.bottom");
		
		this.tools = this.createPane(tools);
		this.output = this.createPane(output);
	}
	
	showFindAndReplace() {
		/*
		get total height, set top pane height to auto, then set bottom pane
		height to (total - top pane total)
		*/
		
		this.tools.setSize("auto");
		
		
	}
	
	createPane({) {
		let pane = new TabPane(size, visible, expanded);
		
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
