import {getIndentLevel} from "modules/utils/editing";

class Line {
	constructor(string, format, startIndex, lineIndex) {
		let {
			level: indentLevel,
			cols: indentCols,
			offset: indentOffset,
		} = getIndentLevel(string, format.indentation);
		
		Object.assign(this, {
			lineIndex,
			startIndex,
			string,
			trimmed: string.trimLeft(),
			indentLevel,
			indentCols,
			indentOffset,
		});
	}
	
	get isEmpty() {
		return this.string.length === 0;
	}
	
	get isBlank() {
		return this.trimmed.length === 0;
	}
	
	get indent() {
		return this.string.substr(0, this.indentOffset);
	}
}

export default Line;
