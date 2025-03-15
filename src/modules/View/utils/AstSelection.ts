let AstSelection = require("modules/AstSelection");

let {s} = AstSelection;

module.exports = {
	...AstSelection,
	
	validate(selection) {
		let {lines} = this.document;
		
		return s(Math.min(selection.startLineIndex, lines.length - 1), Math.min(selection.endLineIndex, lines.length));
	},
};
