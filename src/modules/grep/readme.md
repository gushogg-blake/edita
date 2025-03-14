# grep

These modules handle the general case of searching for patterns within files (or the current selection, etc) and possibly doing something with the results.

The idea is to be as generic and modular as is reasonable, to allow for different features to re-use common functionality.

Find and replace is the obvious case, and is where this code mostly originates from.

CodePatterns is another case, very similar to F&R but more powerful.

// TODO also LSP-driven find usages may end up using generic find results.

Don't worry about the technical meaning of the word "grep"; it's just a memorable name for this type of functionality.

grep uses generators to provide the matches to callers, and it has a concept of editing, and will listen for changes to the document at any location (not just results), so you can replace occurrences and/or make other changes to the document as you're iterating through the find results without worrying about invalidating subsequent results. grep will not search within any text inserted during the search, for example if text is added to the end of the document while processing an earlier result, that text will be skipped.
