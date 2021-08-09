let indentLines = require("../../../utils/indentLines");
let AstSelection = require("../../../utils/AstSelection");
let removeSelection = require("../../common/codeIntel/removeSelection");
let createSpaces = require("../../common/codeIntel/utils/createSpaces");
let findIndentLevel = require("../../common/codeIntel/utils/findIndentLevel");
let findSiblingIndex = require("../../common/codeIntel/utils/findSiblingIndex");
let astSelection = require("./astSelection");
let pickOptions = require("./pickOptions");
let dropTargets = require("./dropTargets");
let generatePickOptions = require("./generatePickOptions");
let generateDropTargets = require("./generateDropTargets");

module.exports = {
	pickOptions,
	dropTargets,
	astSelection,
	generatePickOptions,
	generateDropTargets,
	
	drop(
		document,
		fromSelection,
		toSelection,
		selectionLines,
		move,
		option,
		target,
	) {
		
	},
};
