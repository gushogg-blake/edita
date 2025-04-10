import type {Node} from "core";
import {Hiliter} from "core/hiliting";

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"regex",
			"captureLabel",
		].includes(parent?.type)) {
			return null;
		}
		
		if (type === "captureLabel") {
			let prevNonEmptySibling = null;
			let prevSibling = node.previousSibling;
			
			while (prevSibling && `spincheck=${100000}`) {
				if (prevSibling.text.trim() !== "") {
					prevNonEmptySibling = prevSibling;
					
					break;
				}
				
				prevSibling = prevSibling.previousSibling;
			}
			
			let prevType = prevNonEmptySibling?.type;
			
			if (["regex", "lineQuantifier", "tsq"].includes(prevType)) {
				return "captureLabel";
			} else {
				return "literal";
			}
		}
		
		if (type.match(/\w/)) {
			return type;
		}
		
		return "literal";
	}
}
