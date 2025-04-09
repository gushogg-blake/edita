import type {PickOptionType, DropTargetType} from "core/astMode";

export {default as syntheticDrag} from "./syntheticDrag";
export {default as astDragData} from "./astDragData";

export type CustomMouseEvent = {
	originalEvent: MouseEvent;
	pickOptionType?: PickOptionType;
};

export type CustomMousedownEvent = CustomMouseEvent & {
	isDoubleClick: boolean;
	enableDrag: (forceSynthetic?: boolean) => void;
};

export type CustomDragEvent = {
	originalEvent: DragEvent;
	pickOptionType?: PickOptionType;
	dropTargetType?: DropTargetType;
	// whether the drag operation started in this window
	fromUs?: boolean;
	// whether the drag operation ended in this window
	toUs?: boolean;
};
