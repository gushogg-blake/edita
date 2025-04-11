# grep

what we want here is interfaces and utility functions

a grep-like feature (findAndReplace/codePatterns) is basically:

	Document -> GrepMatch[]

we define a simple interface for match here, but nothing specific -- just url (inc selection), some context for find results, (which should be grep results?), and a replace() method that either does the replacement or returns a description (this last option better, probably).

we implement the overall architecture of a grep feature, as per below.

Takes:

- a list of FileLikeURLs (e.g. from glob, the current file, all open files, the current selection*)

- a function FileLikeURL -> Document, so calling code can either read from disk or use the Document of a currently open editor

- a FindOptions

...and returns/generates a list of GrepMatchedFiles, in the form:

{
	url,
	matches: GrepMatch[],
}

we work with the full Document at this stage, at least

we can make it lightweight by not parsing or watching

the perf hit of loading up all the files ... I think that's there anyway, as we need a Document to do the search

perf improvement would be to move the *whole thing* to a worker, and have our F&R component be just the UI to that. does this bring in async issues? it would mean not having references to the same Document, which might be a simplifying thing in itself come to think of it.

but if we work with open documents, we'll have to sync them between main and the worker. maybe just something ... anyway, not summat to worry about for now.

interface GrepMatch {
	document: Document;
	selection: Selection;
	edit?: Edit; // for replace
}
