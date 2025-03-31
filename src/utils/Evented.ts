import {removeInPlace} from "utils/array";

class Event {
	constructor() {
		this.defaultPrevented = false;
	}
	
	preventDefault() {
		this.defaultPrevented = true;
	}
}

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;
type Handler<T> = (params: T) => void;

export default class<T extends EventMap> {
	private _handlers: {
		[k in keyof T]?: Handler<T>[],
	} = {};
	
	constructor() {
		this._handlers = {};
	}
	
	on(event, handler) {
		if (!this._handlers[event]) {
			this._handlers[event] = [];
		}
		
		this._handlers[event].push(handler);
		
		return () => {
			removeInPlace(this._handlers[event], handler);
			
			if (this._handlers[event].length === 0) {
				delete this._handlers[event];
			}
		}
	}
	
	onNext(event, handler) {
		let remove = this.on(event, function(arg) {
			handler(arg);
			
			remove();
		});
	}
	
	fire(event, arg) {
		if (!this._handlers[event]) {
			return;
		}
		
		let e = new Event();
		
		for (let handler of this._handlers[event]) {
			handler(arg, e);
		}
		
		return e;
	}
}
