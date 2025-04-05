import type {Query} from "web-tree-sitter";
import type {CaptureSingleResult} from "core/Tree";
import Lang from "./Lang";

export {Lang};

export type Injection = {
	pattern: string;
	lang: string | (capture: CaptureSingleResult) => Lang;
	query: Query;
	combined?: boolean;
	excludeChildren?: boolean;
};
