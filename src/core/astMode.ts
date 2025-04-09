import type {Selection, Document, Node, Line} from "core";

/*
NOTE not sure how much sense it makes to have AST mode in core
as it's arguably more of a "feature" that could be kept at a
higher level (modules) and more separate. It also knows a lot
about the UI -- isPeekingAstMode, for example, is purely a UI
concept related to whether you're holding Esc as a modifier or
have switched to AST mode. It also knows about events.

In favour of keeping it in core, though:

- normal mode stuff is in core and that arguably includes UI
concepts -- the cursor, for example, is a UI thing but we're so
used to it that it seems at home in core.

- AST mode should be a first-class citizen alongside normal mode

(the reason the UI stuff needs to be in core is that astIntel
modules in base can have signatures that accept a MultiStepCommand,
and having them know about the UI -- as in import {MultiStepCommand}
from "ui/Editor/..." -- seems wrong)
*/

/*
AstSelectionLine:

(possibly relative) indent and string (without indentation)

NOTE this could probably be merged with something more generic, as
this structure is bound to be useful elsewhere -- or maybe those places
use AstSelectionLine...
*/

export type AstSelectionLine = {
	indent: number;
	string: string;
};

export type AstSelectionContents = AstSelectionLine[];

/*
some AST commands (like wrap) involve an intricate dance between
normal mode and AST mode. MultiStepCommand is for coordinating
that. every AST manipulation is performed as a multi step command
for consistency, but not all will use the functionality.
*/

export interface MultiStepCommand extends Evented<{
	complete: void;
	canceled: void;
	resolved: void;
}> {
	isPeekingAstMode: boolean;
	
	// copy the current ast selection to the AST clipboard
	setClipboard(): void;
	
	// set the selection for when we return to AST mode
	setSelectionOnReturnToAstMode(astSelection: AstSelection): void;
}

/*
apply/setNormalModeSelection: some manipulations edit the doc,
others just set the selection
*/

export type AstManipulation = {
	code: string;
	name: string;
	group?: string;
	isAvailable: (document: Document, selection: Selection) => boolean;
	apply?: (multiStepCommand: MultiStepCommand, document: Document, astSelection: AstSelection) => AstManipulationResult;
	setNormalModeSelection?: (document: Document, astSelection: AstSelection) => Selection;
};

export type AstManipulationResult = {
	replaceSelectionWith: AstSelectionContents,
	onPasteFromNormalMode?: (paste: any) => void; // TYPE
};

export type DropTargetType = {
	type: string;
	label: string;
	isAvailable: (document: Document, lineIndex: number) => boolean;
	
	handleDrop: (
		document: Document,
		fromSelection: Selection,
		toSelection: Selection,
		lines: Line[],
		move: boolean,
		pickOptionType: string | null,
	) => void;
};

export type PickOptionType = {
	type: string;
	label: string;
	isAvailable: (document: Document, lineIndex: number) => boolean;
	getSelection: (document: Document, lineIndex: number) => AstSelection;
};
