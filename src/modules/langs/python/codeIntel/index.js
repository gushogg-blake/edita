module.exports = {
	shouldIndentOnNewline(document, line, cursor) {
		
	},
	
	indentAdjustmentAfterInsertion(document, line, cursor) {
		return 0;
	},
	
	async isProjectRoot(dir) {
		return (await platform.fs(dir).readdir()).includes("setup.py");
	},
};
