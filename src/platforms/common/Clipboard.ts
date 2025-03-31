import {Evented} from "utils";

export default class extends Evented<{
	set: string;
}> {
	abstract read(): Promise<string> | string;
	abstract readSelection(): Promise<string> | string;
	abstract write(): Promise<void>;
	abstract writeSelection(): Promise<void>;
}
