let expandTabs = require("./utils/string/expandTabs");
let getIndentLevel = require("./langs/common/utils/getIndentLevel");

class Line {
	constructor(string, fileDetails, startIndex) {
		let {
			level: indentLevel,
			cols: indentCols,
		} = getIndentLevel(string, fileDetails.indentation);
		
		let {
			tabWidth,
		} = app.prefs;
		
		let width = expandTabs(string, tabWidth).length;
		
		let splitByTabs = string.split("\t");
		let variableWidthParts = [];
		
		for (let i = 0; i < splitByTabs.length; i++) {
			let str = splitByTabs[i];
			
			variableWidthParts.push(["string", str]);
			
			if (i < splitByTabs.length - 1) {
				variableWidthParts.push(["tab", tabWidth - str.length % tabWidth]);
			}
		}
		
		Object.assign(this, {
			startIndex,
			string,
			trimmed: string.trimLeft(),
			variableWidthParts,
			renderHints: [],
			openers: [],
			closers: [],
			width,
			indentLevel,
			indentCols,
		});
	}
}

module.exports = Line;
