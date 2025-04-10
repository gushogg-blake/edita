import {Evented} from "utils";
import type {Side} from "ui/app/panes";

export default class Pane extends Evented<{
	show: void;
	hide: void;
	update: void;
	save: void;
}> {
	position: Side;
	visible: boolean;
	size: number;
	
	constructor(position, size, visible) {
		super();
		
		this.position = position;
		this.size = size;
		this.visible = visible;
	}
	
	resize(diff) {
		this.size += diff;
		
		this.fire("update");
	}
	
	resizeAndSave(diff) {
		this.resize(diff);
		
		this.fire("save");
	}
	
	show() {
		this.setVisibility(true);
	}
	
	hide() {
		this.setVisibility(false);
	}
	
	toggle() {
		this.setVisibility(!this.visible);
	}
	
	setVisibility(visible) {
		this.visible = visible;
		
		this.fire("update");
		this.fire(visible ? "show" : "hide");
	}
}
