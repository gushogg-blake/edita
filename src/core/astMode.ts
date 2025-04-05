/*
NOTE not sure what should be in here and what should be in
modules/astCommon

core is for more basic stuff, modules is for features... ast mode
is kind of a first-class citizen so arguably some of its types
should be here, but it's also a feature that can largely be
separated from all the rest.

will keep both (this and the stuff that's in astCommon that could
be moved here) and see how it goes.

maybe ./AstSelection should be moved here as well
*/

export type AstSelectionLine = [number, string]; // TYPE need to refactor this to an object really -- indentLevel, trimmed string

export type AstSelectionContents = AstSelectionLine[];
