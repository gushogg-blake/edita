import type {Node} from "core";

export type AstHint = {
	all: Node[];
	onLine: Node[];
	notOnLine: Node[];
};
