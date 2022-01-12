//let indentLines = require("modules/utils/indentLines");
let AstSelection = require("modules/utils/AstSelection");

let lang;

module.exports = {
	set lang(_lang) {
		lang = _lang;
		
		delete this.lang;
	},
	
	convertVariableAssignmentsToObject: { // TODO support functions as well?
		code: "convertVariableAssignmentsToObject",
		name: "Convert to object",
		
		isAvailable(document, selection) {
			let {lines} = document;
			let {startLineIndex, endLineIndex} = selection;
			
			for (let i = startLineIndex; i < endLineIndex; i++) {
				let line = lines[i];
				let nodes = document.getNodesOnLine(i);
				
				if (line.trimmed.length === 0) {
					continue;
				}
				
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
			let indentStr = document.fileDetails.indentation.string;
			let {startLineIndex: start, endLineIndex: end} = selection;
			let {indentLevel: baseIndentLevel} = lines[start];
			let statements = [];
			
			for (let i = start; i < end; i++) {
				let line = lines[i];
				let nodes = document.getNodesOnLine(i);
				
				if (line.trimmed.length === 0) {
					statements.push({
						type: "blankLine",
					});
					
					continue;
				}
				
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
			
			return AstSelection.selectionLinesToStrings([
				header,
				...transformedLines,
				footer,
			], indentStr, baseIndentLevel);
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
};
