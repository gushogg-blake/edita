# grep

Takes:

- a list of URLs (e.g. from glob, the current file, all open files, the current selection*)

- a function URL -> Document, so calling code can either read from disk or use the Document of a currently open editor

- a FindOptions

...and returns/generates a list of GrepMatchedFiles, in the form:

{
	url,
	matches: GrepMatch[],
}

GrepMatch = {
	url,
	line: string, // for context
	selection,
	string,
	regExpMatch?: RegExpMatchArray,
};

we don't keep the Document in the results, although it would be convenient, to avoid using too much memory. we want to keep the results fairly lean so we can keep a few pages of many results around

for the actual grepping, Document will probs use functions from this module to search itself, so grep will call Document to get results then Document will call something in grep to find them. actualyl that probably doesn't make sense -- the logci should be here. keep it out of Document, it doesn't need to be there.

\* URLs can contain a selection in the hash, like file:///a/b/c.ts#123,0-456,10 -- see core/URL.
