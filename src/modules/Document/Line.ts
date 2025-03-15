let expandTabs = require("modules/utils/expandTabs");
let getIndentLevel = require("modules/utils/getIndentLevel");

class Line {
	constructor(string, format, startIndex, lineIndex) {
		let {
			level: indentLevel,
			cols: indentCols,
			offset: indentOffset,
		} = getIndentLevel(string, format.indentation);
		
		let {
			tabWidth,
		} = base.prefs;
		
		let width = expandTabs(string, tabWidth).length;
		
		let splitByTabs = string.split("\t");
		let variableWidthParts = [];
		
		let offset = 0;
		
		for (let i = 0; i < splitByTabs.length; i++) {
			let str = splitByTabs[i];
			
			/*
			always have at least one empty string so that an empty line
			has a single empty variable-width part
			*/
			
			if (str || i === 0) {
				variableWidthParts.push({
					offset,
					type: "string",
					string: str,
					width: str.length,
				});
				
				offset += str.length;
			}
			
			if (i < splitByTabs.length - 1) {
				variableWidthParts.push({
					offset,
					type: "tab",
					string: "\t",
					width: tabWidth - str.length % tabWidth,
				});
				
				offset++;
			}
		}
		
		Object.assign(this, {
			lineIndex,
			startIndex,
			string,
			trimmed: string.trimLeft(),
			variableWidthParts,
			width,
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
