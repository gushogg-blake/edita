import type {Node} from "core";
import {Hiliter} from "core/hiliting";

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		return null;
	}
}
