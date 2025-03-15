import getNewline from "modules/utils/getNewline";
import guessIndent from "modules/utils/guessIndent";
import getIndentationDetails from "modules/utils/getIndentationDetails";
import getIndentLevel from "modules/utils/getIndentLevel";

class SelectionContents {
	constructor(lines) {
		this.lines = lines;
	}
	
	getString(document, baseIndentLevel=0, noHeaderIndent=false) {
		let {newline} = document.format;
		
		return this.getLineStrings(document, baseIndentLevel, noHeaderIndent).join(newline);
	}
	
	getLineStrings(document, baseIndentLevel=0, noHeaderIndent=false) {
		let {indentation: indentationDetails} = document.format;
		
		return this.lines.map(function({indentLevel, string}, i) {
			if (noHeaderIndent && i === 0) {
				return string;
			} else {
				return indentationDetails.string.repeat(baseIndentLevel + indentLevel) + string;
			}
		});
	}
	
	static fromSelection(document, selection) {
		let {left, right} = selection;
		let firstLine = document.lines[left.lineIndex];
		
		let lines = document.lines.slice(left.lineIndex, right.lineIndex + 1).map(function(line, i) {
			let indentLevel = Math.max(0, line.indentLevel - firstLine.indentLevel);
			let trimLeft = 0;
			let trimRight = 0;
			
			if (line.lineIndex === left.lineIndex) {
				trimLeft = left.offset <= line.indentOffset ? 0 : left.offset - line.indentOffset;
			}
			
			if (line.lineIndex === right.lineIndex) {
				trimRight = right.offset <= line.indentOffset ? 0 : line.string.length - right.offset;
			}
			
			let string = line.trimmed.substring(trimLeft, line.trimmed.length - trimRight);
			
			return {
				indentLevel,
				string,
			};
		});
		
		return new SelectionContents(lines);
	}
	
	static fromString(string) {
		let newline = getNewline(string);
		let indentationDetails = getIndentationDetails(guessIndent(string) || base.getPref("defaultIndent"));
		
		let lines = string.split(newline).map(function(lineString) {
			return {
				indentLevel: getIndentLevel(lineString, indentationDetails).level,
				string: lineString.trimLeft(),
			};
		});
		
		return new SelectionContents(lines);
	}
}

export default SelectionContents;
