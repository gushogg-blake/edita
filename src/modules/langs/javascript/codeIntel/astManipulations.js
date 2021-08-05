let AstSelection = require("../../../utils/AstSelection");

module.exports = {
	convertVariableAssignmentsToObject: {
		code: "convertVariableAssignmentsToObject",
		name: "Convert to object",
		
		isAvailable(lines, selection) {
			//let selectedLines = AstSelection.getSelectedLines(lines, selection);
			let [start, end] = selection;
			
			for (let i = start; i < end; i++) {
				let line = lines[i];
				let {nodes} = line;
				
				if (line.trimmed.length === 0) {
					continue;
				}
				
				if (
					nodes.length < 4
					|| !["expression_statement", "lexical_declaration", "variable_declaration"].includes(nodes[0].type)
					|| nodes[0].type === "expression_statement" && nodes[1].type !== "assignment_expression"
				) {
					console.log(nodes);
					return false;
				}
				
				i = nodes[0].endPosition.row;
			}
			//for (let line of selectedLines) {
			//	console.log(line);
			//}
			
			return true;
		},
		
		/*
		
		*/
		
		apply(lines, selection) {
			return normaliseString(`
				
			`);
		},
	},
};
