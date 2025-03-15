export default {
	dragstart(details, dataTransfer) {
		let e = new MouseEvent("dragstart", details);
		
		e.dataTransfer = dataTransfer;
		
		return e;
	},
	
	dragover(details, dataTransfer) {
		let e = new MouseEvent("dragover", details);
		
		e.dataTransfer = dataTransfer;
		
		return e;
	},
	
	drop(details, dataTransfer) {
		let e = new MouseEvent("drop", details);
		
		e.dataTransfer = dataTransfer;
		
		return e;
	},
	
	dragend(details, dataTransfer) {
		let e = new MouseEvent("dragend", details);
		
		e.dataTransfer = dataTransfer;
		
		return e;
	},
	
	dragenter(details, dataTransfer) {
		let e = new MouseEvent("dragenter", details);
		
		e.dataTransfer = dataTransfer;
		
		return e;
	},
	
	dragleave(details, dataTransfer) {
		let e = new MouseEvent("dragleave", details);
		
		e.dataTransfer = dataTransfer;
		
		return e;
	},
};
