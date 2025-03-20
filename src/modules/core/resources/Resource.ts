import {URL, Format} from "modules/core";

export default interface Resource {
	url: URL;
	contents: string;
	format: Format;
}
