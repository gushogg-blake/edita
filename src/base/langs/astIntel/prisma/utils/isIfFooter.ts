import {isHeader} from "modules/astIntel/utils";

export default function(document, lineIndex) {
	if (isHeader(document, lineIndex)) {
		return false;
	}
	
	let nodes = document.getNodesOnLine(lineIndex);
	
	return nodes.some(function(node) {
		return node.type === "}" && node.parent?.parent?.type === "if_statement";
	});
}
