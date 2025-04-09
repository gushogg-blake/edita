import type {PickOptionType, DropTargetType} from "core/astMode";
import AstMode from "./AstMode";

export {AstMode};

export class PickOption {
	lineIndex: number;
	type: PickOptionType;
	
	constructor(lineIndex: number, type: PickOptionType) {
		this.lineIndex = lineIndex;
		this.type = type;
	}
}

export class DropTarget {
	lineIndex: number;
	type: DropTargetType;
	
	constructor(lineIndex: number, type: DropTargetType) {
		this.lineIndex = lineIndex;
		this.type = type;
	}
}
