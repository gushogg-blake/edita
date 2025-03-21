import AstSelection, {a} from "modules/core/AstSelection";

export default {
	...AstSelection,
	
	validate(selection) {
		let {lines} = this.document;
		
		return a(Math.min(selection.startLineIndex, lines.length - 1), Math.min(selection.endLineIndex, lines.length));
	},
};
