import type {URL} from "core";

export interface Resource {
	url: URL;
	delete(): Promise<void>;
}
