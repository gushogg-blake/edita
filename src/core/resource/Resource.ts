import type {FileLikeURL} from "core";

export interface Resource {
	url: FileLikeURL;
	delete(): Promise<void>;
}
