module.exports = {
	shouldIndentOnNewline(document, line, lineIndex, cursor) {
		
	},
	
	indentAdjustmentAfterInsertion(document, line, lineIndex) {
		return 0;
	},
	
	async isProjectRoot(dir) {
		return (await platform.fs(dir).readdir()).includes("Makefile");
	},
};
