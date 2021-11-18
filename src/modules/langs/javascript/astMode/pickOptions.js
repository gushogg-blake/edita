module.exports = {
	contents: {
		type: "contents",
		label: "Contents",
		
		isAvailable(document, selection) {
			//return document.getHeadersOnLine(selection.startLineIndex).length > 0);
		},
	},
};
