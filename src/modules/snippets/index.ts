/*
NOTE added this to give us a Snippet type for typing.

the functionality of snippets is used in a few diff places
and was never centralised into a Snippet class.

the rest of the files in this folder are more about
implementation details of any snippet-like functionality
whereas this type includes details about the langs etc
and reflects what's stored in the snippet JSON files.

so it doesn't feel quite natural having this here -- maybe
it would be better to keep this with the store functionality?
*/

export type Snippet = {
	id?: number;
	name: string;
	langGroups: string[];
	langs: string[];
	text: string;
	keyCombo: string | null;
};
