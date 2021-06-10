module.exports = {
	dragstart(details) {
		let e = new MouseEvent("dragstart", details);
		
		e.dataTransfer = {
			setDragImage() {
			},
		};
		
		return e;
	},
	
	dragover(details) {
		let e = new MouseEvent("dragover", details);
		
		e.dataTransfer = {
			setDragImage() {
			},
		};
		
		return e;
	},
};
