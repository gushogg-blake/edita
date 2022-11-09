let expandTabs = require("modules/utils/expandTabs");
let getIndentLevel = require("modules/utils/getIndentLevel");

class Line {
	constructor(string, fileDetails, startIndex) {
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
			
			if (str) {
				variableWidthParts.push({
					type: "string",
					string: str,
				});
			}
			
			if (i < splitByTabs.length - 1) {
				variableWidthParts.push({
					type: "tab",
					width: tabWidth - str.length % tabWidth,
				});
			}
		}
		
		Object.assign(this, {
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
