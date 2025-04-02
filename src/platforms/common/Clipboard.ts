import {Evented} from "utils";
import type {AsyncOrSync} from "utils/types";

export default class extends Evented<{
	set: string;
}> {
	abstract read(): AsyncOrSync<string>;
	abstract readSelection(): AsyncOrSync<string>;
	abstract write(str: string): AsyncOrSync<void>;
	abstract writeSelection(str: string): AsyncOrSync<void>;
}
