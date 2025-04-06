import type {Node} from "core";

export abstract class Hiliter {
	abstract getHiliteClass(node: Node): string;
}
