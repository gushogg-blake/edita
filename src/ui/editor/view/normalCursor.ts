import {Evented} from "utils";
import type {View} from "ui/editor/view";

export class NormalCursor extends Evented<{
	
}> {
	// whether the cursor blink is currently on (switches on and
	// off with an interval)
	cursorBlinkOn: boolean = false;
	
	private cursorInterval: ReturnType<typeof setInterval> | null = null;
	
	private view: View;
	
	constructor(view: View) {
		super();
		
		this.view = view;
	}
	
	
	startCursorBlink() {
		if (!this.visible) {
			return;
		}
		
		if (this.mode !== "normal") {
			return;
		}
		
		if (this.cursorInterval) {
			clearInterval(this.cursorInterval);
		}
		
		this.cursorBlinkOn = true;
		
		this.cursorInterval = setInterval(() => {
			this.cursorBlinkOn = !this.cursorBlinkOn;
			
			this.updateCanvas();
		}, base.prefs.cursorBlinkPeriod);
		
		this.scheduleRedraw();
	}
	
	clearCursorBlink() {
		if (this.cursorInterval) {
			clearInterval(this.cursorInterval);
		}
		
		this.cursorInterval = null;
	}
	
}
