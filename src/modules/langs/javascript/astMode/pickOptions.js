module.exports = {
	contents: {
		type: "contents",
		label: "Contents",
		
		isAvailable(document, selection) {
			return document.getHeadersOnLine(selection.startLineIndex).length > 0;
		},
		
		getSelection(document, selection) {
			console.log(document.getHeadersOnLine(selection.startLineIndex));
		},
	},
};
