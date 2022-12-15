let tokeniseCodex = require("./tokeniseCodex");

/*
a query consists of a tree-sitter query and an optional prefix and suffix.

these are just literals for now, e.g.

:p 
:indent 2

let (id) = (fn)

@lines* - 0 or more lines, lazy

@lines** - 0 or more lines, greedy

@lines+

@lines++

module.exports = (fn);
*/

function query(code, codex) {
	let parts = tokeniseCodex(codex);
	
	
}

module.exports = query;
