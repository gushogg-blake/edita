let AstSelection = require("modules/utils/AstSelection");

let {s} = AstSelection;

module.exports = {
	...AstSelection,
	
	validate(selection) {
		let {lines} = this.document;
		
		return s(Math.min(selection.startLineIndex, lines.length), Math.min(selection.endLineIndex, lines.length));
	},
};
