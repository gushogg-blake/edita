let getNewline = require("modules/utils/getNewline");
let guessIndent = require("modules/utils/guessIndent");
let getIndentationDetails = require("modules/utils/getIndentationDetails");
let getIndentLevel = require("modules/utils/getIndentLevel");

class SelectionContents {
	constructor(lines) {
		this.lines = lines;
	}
	
	getString(document, baseIndentLevel=0, noHeaderIndent=false) {
		let {newline} = document.fileDetails;
		
		return this.getLineStrings(document, baseIndentLevel, noHeaderIndent).join(newline);
	}
	
	getLineStrings(document, baseIndentLevel=0, noHeaderIndent=false) {
		let {indentationDetails} = document.fileDetails;
		
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
			let string;
			
			if (line.lineIndex === left.lineIndex) {
				string = line.trimmed.substr(Math.max(0, left.offset - line.indentOffset));
			} else if (line.lineIndex === right.lineIndex) {
				let trimRight = line.string.length - right.offset;
				
				string = line.trimmed.substring(0, Math.max(0, line.string.length - line.indentOffset - trimRight));
			} else {
				string = line.trimmed;
			}
			
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
		
		let lines = string.split(getNewline(str)).map(function(lineString) {
			return {
				indentLevel: getIndentLevel(line, indentationDetails).level,
				string: lineString.trimLeft(),
			};
		});
		
		return new SelectionContents(lines);
	}
}

module.exports = SelectionContents;
