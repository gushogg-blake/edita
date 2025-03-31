import type {Selection} from "core";

export default class Edit {
	selection: Selection;
	string: string;
	replaceWith: string;
	newSelection: Selection;
	
	constructor(selection, string, replaceWith, newSelection) {
		this.selection = selection;
		this.string = string;
		this.replaceWith = replaceWith;
		this.newSelection = newSelection;
	}
	
	reverse() {
		return new Edit(
			this.newSelection,
			this.replaceWith,
			this.string,
			this.selection,
		);
	}
}
