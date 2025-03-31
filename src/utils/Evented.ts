import {removeInPlace} from "utils/array";

class Event2 {
	defaultPrevented: boolean = false;
	
	preventDefault() {
		this.defaultPrevented = true;
	}
}

type BaseEventMap = Record<string, any>;
type EventType<EventMap extends BaseEventMap> = string & keyof EventMap;
type Handler<ArgType> = (arg: ArgType, e: Event2) => void;
type Remover = () => void;

export default class Evented<EventMap extends BaseEventMap> {
	_handlers: {
		[K in keyof EventMap]?: Handler<EventMap[K]>[];
	} = {};
	
	constructor() {
		this._handlers = {};
	}
	
	on<T extends EventType<EventMap>>(event: T, handler: Handler<EventMap[T]>): Remover {
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
	
	onNext<T extends EventType<EventMap>>(event: T, handler: Handler<EventMap[T]>): Remover {
		let remove = this.on(event, function(arg, e) {
			handler(arg, e);
			
			remove();
		});
		
		return remove;
	}
	
	fire<T extends EventType<EventMap>>(event: T, arg: EventMap[T]): Event2 {
		if (!this._handlers[event]) {
			return;
		}
		
		let e = new Event2();
		
		for (let handler of this._handlers[event]) {
			handler(arg, e);
		}
		
		return e;
	}
}
