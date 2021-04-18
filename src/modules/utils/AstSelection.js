function fromLineIndex(lines, lineIndex, lang) {
	return lang.astSelectionFromLineIndex(lines, lineIndex);
}

module.exports = {
	fromLineIndex,
};
