let expandTabs = require("modules/utils/expandTabs");
let getIndentLevel = require("modules/utils/getIndentLevel");

class Line {
	constructor(string, fileDetails, startIndex, lineIndex) {
		let {
			level: indentLevel,
			cols: indentCols,
			offset: indentOffset,
		} = getIndentLevel(string, fileDetails.indentation);
		
		let {
			tabWidth,
		} = base.prefs;
		
		let width = expandTabs(string, tabWidth).length;
		
		let splitByTabs = string.split("\t");
		let variableWidthParts = [];
		
		for (let i = 0; i < splitByTabs.length; i++) {
			let str = splitByTabs[i];
			
			/*
			always have at least one empty string so that an empty line
			has a single empty variable-width part
			*/
			
			if (str || i === 0) {
				variableWidthParts.push({
					type: "string",
					string: str,
					width: str.length,
				});
			}
			
			if (i < splitByTabs.length - 1) {
				variableWidthParts.push({
					type: "tab",
					string: "\t",
					width: tabWidth - str.length % tabWidth,
				});
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
}

module.exports = Line;
