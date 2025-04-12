import {Evented} from "utils";
import type {Cursor} from "core";
import type {View} from "ui/editor/view";


export type ActiveCompletions = {
	completions: any[], // TYPE LSP
	selectedCompletion: any; // ^
	cursor: Cursor;
};


export class Completions extends Evented<{
	
}> {
	
	activeCompletions: ActiveCompletions | null = null;
	
	private view: View;
	
	constructor(view: View) {
		super();
		
		this.view = view;
	}
	
	setActiveCompletions(activeCompletions: ActiveCompletions) {
		this.activeCompletions = activeCompletions;
		
		this.fire("updateCompletions");
	}
	
	
}
