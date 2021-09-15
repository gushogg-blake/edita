let countSpace = require("./countSpace");
let createSpaces = require("./createSpaces");
let findIndentLevel = require("./findIndentLevel");
let findSiblingIndex = require("./findSiblingIndex");

let api = {
	countSpace,
	createSpaces,
	findIndentLevel,
	findSiblingIndex,
	
	findNextLineIndexAtIndentLevel(document, lineIndex, indentLevel) {
		let {lines} = document;
		
		for (let i = lineIndex + 1; i < lines.length; i++) {
			if (lines[i].indentLevel === indentLevel) {
				return i;
			}
		}
		
		return null;
	},
	
	findPrevLineIndexAtIndentLevel(document, lineIndex, indentLevel) {
		let {lines} = document;
		
		for (let i = lineIndex - 1; i >= 0; i--) {
			if (lines[i].indentLevel === indentLevel) {
				return i;
			}
		}
		
		return null;
	},
};

module.exports = api;
