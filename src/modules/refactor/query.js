let parseMatch = require("./parseMatch");

/*
match descriptions consist of a series of literals and tree-sitter
queries, for example: "return (array)". Here the "return " is a literal
and the (array) is a query.

the whole sequence must match in order to be counted, and the whole
sequence constitutes the text that will ultimately be replaced by the
refactor. for example, to convert an object module to a function that
returns the object, you could do this:

match:

module.exports = (object @obj)

replaceWith:

module.exports = function() {
	return @obj;
}

or if there is only one (object) query:

module.exports = function() {
	return @object;
}

literals just specify "something that comes before/after the query"
so this would also work:

module (obj)

the matched text to be replaced starts at the start of the first
literal (or the first query if there is no literal at the beginning)
and ends at the end of the last literal.

if \((expression @condition)
	@if
else
	@else
}

might make the whole match something like:

if (someCondition) {
	123;
	456;
} else {
	789;
}

(indentation / @label syntax possible easier way to get nested blocks
than many captures, e.g. (if (condition @condition) (then @then) etc))
- could possibly have just one level of indentation to make parsing
simpler, although still seems like it adds a lot of complexity, and is
something that tree-sitter queries already handle...

ANYWAY - to get the matches, we first run all the queries to get nodes.
then we filter them out by simply checking whether ... actually it gets
complex, as there are many possible combinations depending on whether
bits of the code are counted as literals or query matches - e.g. you
might want to match let (id) = (function) in some code like:

let x = 123;

let a = function() {
	...
	
	function() {
	}
	
	...
	
	let c = function() {
	}
}

and it wouldn't be clear whether the inner function...

perhaps this should be the rule:

- literals can be in matched nodes (otherwise this seems like it would
be too restrictive)

- unless they are on their own line, literals must appear on the same
line as the matched node - so the first function above wouldn't match,
because there is a let (id) before it but it's on a different line and
the query is let (id) = (function).

- if they are on their own line, literals must not be on the same line
as matched nodes

--- so then we filter out nodes that aren't prefixed or suffixed by
adjacent literals, according to the same/different line rules.

then it gets complicated again, because each query matches multiple nodes.
if only single nodes were matched, we could just start from the node
matched by the first query and check that the whole sequence was there
- the starting node, the next literal, the node matched for the next
query, etc.

but with multiple nodes there are multiple possible combinations to put
together into the whole match, and there can of course  be multiple
matches in a file. so the question is how to assemble the nodes and
literals into matches. something like a lazy/greedy approach ... or

maybe the syntax should be more like a set of commands:


appearsAbove /let \w+ = require/

precede let (id) =

query (function) indent=0


shorten to

q ()

or maybe default to the query, so if the line starts with a bracket
then it's a query:

-- so each line is read as a command, with sensible sugar

f (variable_declaration) # there's a variable declaration above, but it
# won't be part of the match (but we can capture stuff from it)

# or

f literal
f \(literal with brackets)

(function) # this is the match

(object) 

could use [] to mark the boundaries of the match to be replaced, defaulting
to the whole match if not specified - e.g.

literal

[literal (match)

literal]



start at the last matched node in the document, search outwards from it to
find the smallest sequence that's a complete match, transform it, mark the
transformed region as done so we don't go into it again, go to next node up
*/

function query(code, match) {
	let parts = parseMatch(match);
	
	
}

module.exports = query;
