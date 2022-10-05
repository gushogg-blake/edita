//let indentLines = require("modules/utils/indentLines");
let AstSelection = require("modules/utils/AstSelection");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

let lang;

module.exports = {
	set lang(_lang) {
		lang = _lang;
		
		delete this.lang;
	},
	
	convertVariableAssignmentsToObject: {
		code: "convertVariableAssignmentsToObject",
		name: "Convert to object",
		
		isAvailable(document, selection) {
			let {lines} = document;
			let {startLineIndex, endLineIndex} = selection;
			
			for (let i = startLineIndex; i < endLineIndex; i++) {
				let line = lines[i];
				
				if (line.trimmed.length === 0) {
					continue;
				}
				
				let nodes = document.getNodesOnLine(i);
				
				if (
					nodes.length < 4
					|| !["expression_statement", "lexical_declaration", "variable_declaration"].includes(nodes[0].type)
					|| nodes[0].type === "expression_statement" && nodes[1].type !== "assignment_expression"
				) {
					return false;
				}
				
				i = nodes[0].endPosition.row;
			}
			
			return true;
		},
		
		apply(document, selection) {
			let {lines} = document;
			let {startLineIndex: start, endLineIndex: end} = selection;
			let {indentLevel: baseIndentLevel} = lines[start];
			let statements = [];
			
			for (let i = start; i < end; i++) {
				let line = lines[i];
				
				if (line.trimmed.length === 0) {
					statements.push({
						type: "blankLine",
					});
					
					continue;
				}
				
				let nodes = document.getNodesOnLine(i);
				
				let [node] = nodes;
				let endLineIndex = node.endPosition.row;
				
				if (i === node.endPosition.row) {
					statements.push({
						type: "singleLine",
						line,
					});
				} else {
					statements.push(
						{
							type: "header",
							line,
						},
						...lines.slice(i + 1, endLineIndex).map(function(line) {
							return {
								type: "multilineContents",
								line,
							};
						}),
						{
							type: "footer",
							line: lines[endLineIndex],
						},
					);
				}
				
				i = endLineIndex;
			}
			
			let header = [0, "let @name = {"];
			
			let transformedLines = statements.map(function(statement) {
				let {type, line} = statement;
				
				if (type === "singleLine") {
					let {trimmed: string} = line;
					
					string = string.replace(/^(let|const|var) /, "");
					string = string.replace(/^(\w+)\s*=\s*/, "$1: ");
					string = string.replace(/;$/, "");
					
					return [1, string + ","];
				} else if (type === "header") {
					let {trimmed: string} = line;
					
					string = string.replace(/^(let|const|var) /, "");
					string = string.replace(/^(\w+)\s*=\s*/, "$1: ");
					
					return [1, string];
				} else if (type === "multilineContents") {
					return [1 + line.indentLevel - baseIndentLevel, line.trimmed];
				} else if (type === "footer") {
					let {trimmed: string} = line;
					
					string = string.replace(/;$/, "");
					
					return [1, string + ","];
				} else if (type === "blankLine") {
					return [1, ""];
				}
			});
			
			let footer = [0, "};@$"];
			
			return {
				replaceSelectionWith: [
					header,
					...transformedLines,
					footer,
				],
			};
		},
	},
	
	unwrap: {
		code: "unwrap",
		name: "Unwrap",
		
		isAvailable(document, selection) {
			
		},
		
		apply(document, selection) {
			
		},
	},
	
	changeIfCondition: {
		code: "changeIfCondition",
		name: "Change `if` condition",
		group: "$change",
		
		isAvailable(document, selection) {
			let nodes = document.getNodesOnLine(selection.startLineIndex, lang);
			
			return nodes.some(node => node.type === "if_statement");
		},
		
		setNormalModeSelection(document, selection) {
			let nodes = document.getNodesOnLine(selection.startLineIndex, lang);
			
			let ifStatement = nodes.find(node => node.type === "if_statement");
			let parenthesizedExpression = ifStatement.children[1];
			let {startPosition, endPosition} = parenthesizedExpression;
			
			return s(c(startPosition.row, startPosition.column + 1), c(endPosition.row, endPosition.column - 1));
		},
	},
	
	changeWhileCondition: {
		code: "changeWhileCondition",
		name: "Change `while` condition",
		group: "$change",
		
		isAvailable(document, selection) {
			let nodes = document.getNodesOnLine(selection.startLineIndex, lang);
			
			return nodes.some(node => node.type === "while_statement");
		},
		
		setNormalModeSelection(document, selection) {
			let nodes = document.getNodesOnLine(selection.startLineIndex, lang);
			
			let whileStatement = nodes.find(node => node.type === "while_statement");
			let parenthesizedExpression = whileStatement.children[1];
			let {startPosition, endPosition} = parenthesizedExpression;
			
			return s(c(startPosition.row, startPosition.column + 1), c(endPosition.row, endPosition.column - 1));
		},
	},
	
	changeForInitialiser: {
		code: "changeForInitialiser",
		name: "Change `for` initialiser",
		group: "$change",
		
		isAvailable(document, selection) {
			let nodes = document.getNodesOnLine(selection.startLineIndex, lang);
			
			return nodes.some(node => node.type === "for_statement");
		},
		
		setNormalModeSelection(document, selection) {
			let nodes = document.getNodesOnLine(selection.startLineIndex, lang);
			
			let forStatement = nodes.find(node => node.type === "for_statement");
			let openingBracket = forStatement.children.find(node => node.type === "(");
			let closingBracket = forStatement.children.find(node => node.type === ")");
			
			return s(
				c(openingBracket.startPosition.row, openingBracket.startPosition.column + 1),
				c(closingBracket.startPosition.row, closingBracket.startPosition.column),
			);
		},
	},
	
	toggleMultilineOuter: {
		code: "toggleMultilineOuter",
		name: "Toggle multi-line (outermost node)",
		
		isAvailable(document, selection) {
			return true;
		},
		
		apply(document, selection) {
			console.log("toggleMultilineOuter");
			
			return [];
		},
	},
};
