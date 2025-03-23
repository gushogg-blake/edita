import {Evented} from "utils";

export default class extends Evented {
	isWeb: boolean;
	isMainWindow: boolean;
	
	// ...
	
	constructor() {
		super();
	}
}
