import {Evented} from "utils";
import type {View} from "ui/editor/view";

export class Wrap extends Evented<{
	
}> {
	
	wrap: boolean;
	
	private view: View;
	
	constructor(view: View) {
		super();
		
		this.view = view;
	}
	
	
	setWrap(wrap: boolean): void {
		if (this.wrap === wrap) {
			return;
		}
		
		this.wrap = wrap;
		
		if (this.wrap) {
			this.setHorizontalScrollNoValidate(0);
		}
		
		this.createWrappedLines();
		
		this.fire("wrapChanged", wrap);
		
		this.scheduleRedraw();
	}
	
	
}
