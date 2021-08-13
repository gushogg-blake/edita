module.exports = {
	shouldIndentOnNewline(line, lines, lineIndex) {
		
	},
	
	indentAdjustmentAfterInsertion(line, lines, lineIndex) {
		return 0;
	},
	
	async isProjectRoot(dir) {
		return (await platform.fs(dir).readdir()).includes("package.json");
	},
};
