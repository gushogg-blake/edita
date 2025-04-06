import AstSelection, {a} from "core/AstSelection";
import Selection, {s} from "core/Selection";
import Cursor, {c} from "core/Cursor";

let lang;

export default function(lang: Lang) {
	return {
		,
		
		convertVariableAssignmentsToObject: {
			code: "convertVariableAssignmentsToObject",
			name: "Convert to object",
			
			isAvailable(document, selection) {
				let {lines} = document;
				let {startLineIndex, endLineIndex} = selection;
				
				for (let i = startLineIndex; i < endLineIndex; i++) {
					let line = lines[i];
					
					if (line.isBlank) {
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
					
					i = nodes[0].end.lineIndex;
				}
				
				return true;
			},
			
			apply(multiStepCommand, document, selection) {
				let {lines} = document;
				let {startLineIndex: start, endLineIndex: end} = selection;
				let {indentLevel: baseIndentLevel} = lines[start];
				let statements = [];
				
				for (let i = start; i < end; i++) {
					let line = lines[i];
					
					if (line.isBlank) {
						statements.push({
							type: "blankLine",
						});
						
						continue;
					}
					
					let nodes = document.getNodesOnLine(i);
					
					let [node] = nodes;
					let endLineIndex = node.end.lineIndex;
					
					if (i === node.end.lineIndex) {
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
			
			apply(multiStepCommand, document, selection) {
				
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
				let {start, end} = parenthesizedExpression;
				
				return s(c(start.lineIndex, start.offset + 1), c(end.lineIndex, end.offset - 1));
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
				let {start, end} = parenthesizedExpression;
				
				return s(c(start.lineIndex, start.offset + 1), c(end.lineIndex, end.offset - 1));
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
					c(openingBracket.start.lineIndex, openingBracket.start.offset + 1),
					c(closingBracket.start.lineIndex, closingBracket.start.offset),
				);
			},
		},
		
		toggleMultilineOuter: {
			code: "toggleMultilineOuter",
			name: "Toggle multi-line (outermost node)",
			
			isAvailable(document, selection) {
				return true;
			},
			
			apply(multiStepCommand, document, selection) {
				console.log("toggleMultilineOuter");
				
				return [];
			},
		},
	};
}
