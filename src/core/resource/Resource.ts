import type {BaseURL} from "core";

export interface Resource {
	url: BaseURL;
	delete(): Promise<void>;
}
