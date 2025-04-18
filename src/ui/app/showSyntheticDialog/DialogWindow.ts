import {mount, unmount} from "svelte";
import {Evented} from "utils";
import inlineStyle from "utils/dom/inlineStyle";
import {on, off} from "utils/dom/domEvents";

export default class extends Evented<{
	close: void;
}> {
	content: HTMLDivElement;
	
	private container: HTMLDivElement;
	private toolbar: HTMLDivElement;
	
	private windowOptions: any; // TYPE
	private closed: boolean = false;
	private renderDiv: (div: HTMLDivElement) => void;
	private toolbarComponent: any; // TYPE Svelte component
	
	constructor(windowOptions, renderDiv: (div: HTMLDivElement) => void) {
		super();
		
		this.windowOptions = windowOptions;
		this.renderDiv = renderDiv;
	}
	
	close() {
		if (this.closed) {
			return;
		}
		
		this.fire("close");
		
		let {toolbarComponent, container} = this;
		
		unmount(toolbarComponent);
		
		container.parentNode.removeChild(container);
		
		this.closed = true;
	}
	
	render() {
		let {windowOptions, renderDiv} = this;
		
		let container = document.createElement("div");
		let toolbar = document.createElement("div");
		let content = document.createElement("div");
		
		this.container = container;
		this.toolbar = toolbar;
		this.content = content;
		
		this.renderDiv(container);
		
		container.appendChild(toolbar);
		container.appendChild(content);
		
		this.setupToolbar();
		
		this.toolbarComponent = mount(base.components.DialogToolbar, {
			target: toolbar,
			
			props: {
				title: windowOptions.title,
				
				onclose: () => {
					this.close();
				},
			},
		});
		
		container.style = inlineStyle({
			position: "fixed",
			zIndex: 100,
			border: "1px solid gray",
			borderRadius: 2,
		    boxShadow: "0 2px 6px -3px #00000040",
			background: "var(--appBackground)",
			visibility: "hidden",
		});
		
		if (!windowOptions.fitContents) {
			let {
				width,
				height,
			} = windowOptions;
			
			inlineStyle.assign(content, {
				width,
				height,
			});
		}
		
		let {
			offsetWidth: width,
			offsetHeight: height,
		} = container;
		
		let x = Math.round(window.innerWidth / 2 - width / 2);
		let y = Math.round(window.innerHeight / 2 - height / 2);
		
		inlineStyle.assign(container, {
			visibility: "visible",
			top: y,
			left: x,
		});
		
		on(container, "keydown", (e) => {
			e.stopPropagation();
			
			if (e.key === "Escape") {
				this.close();
			}
		});
	}
	
	setupToolbar() {
		let dragging = false;
		let distance = 0;
		let origMouseCoords;
		let origPosition;
		
		function mousedown(e) {
			e.stopPropagation();
			e.preventDefault();
			
			if (e.target.nodeName.toLowerCase() === "button") {
				return;
			}
			
			on(window, "mousemove", mousemove);
			on(window, "mouseup", mouseup);
		}
		
		function mousemove(e) {
			if (!dragging) {
				distance++;
				
				if (distance >= 2) {
					dragging = true;
					
					origMouseCoords = {
						x: e.clientX,
						y: e.clientY,
					};
					
					origPosition = {
						x: this.container.offsetLeft,
						y: this.container.offsetTop,
					};
				}
				
				return;
			}
			
			let diff = {
				x: e.clientX - origMouseCoords.x,
				y: e.clientY - origMouseCoords.y,
			};
			
			inlineStyle.assign(this.container, {
				top: origPosition.y + diff.y,
				left: origPosition.x + diff.x,
			});
		}
		
		function mouseup(e) {
			dragging = false;
			distance = 0;
			
			off(window, "mousemove", mousemove);
			off(window, "mouseup", mouseup);
		}
	}
}
