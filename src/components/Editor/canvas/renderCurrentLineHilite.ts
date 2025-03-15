export default function(layers, view, offsets) {
	let {
		sizes: {width},
		measurements: {rowHeight},
	} = view;
	
	let context = layers.hilites;
	
	//let x;
	let y = offsets.rowOffset;
	
	let startY;
	let endY;
	
	return {
		init() {
			//context.fillStyle = base.theme.editor.currentLineHiliteBackground;
		},
		
		startRow() {
		},
		
		endRow() {
		},
	};
}
