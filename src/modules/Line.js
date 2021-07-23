let expandTabs = require("./utils/string/expandTabs");
let getIndentLevel = require("./langs/common/utils/getIndentLevel");

/*
Lines/wrappedLines

Line objects and wrappedLine objects should be mostly interchangeable for
rendering, so that no wrapping logic is necessary if wrapping is turned off
(we can just use the Line and leave .wrappedLines undefined).

This means that wrapped lines will have some of the same properties:

- startOffset (this is really only needed for wrapped lines as it indicates
where the wrapped line starts in the main line -- Lines have it set to 0 for
simplicity)


*/

class Line {
	constructor(string, fileDetails, startIndex) {
		let {
			level: indentLevel,
			cols: indentCols,
		} = getIndentLevel(string, fileDetails.indentation);
		
		let {
			tabWidth,
		} = app.prefs;
		
		let withTabsExpanded = expandTabs(string, tabWidth);
		
		// NOTE withTabsExpanded probs not that useful in general as hard to
		// calculate indexes...
		// NOTE might also be good to calculate it on the fly to avoid having
		// to recreate lines if tab width changes
		
		let splitByTabs = string.split("\t");
		let variableWidthParts = [];
		
		for (let i = 0; i < splitByTabs.length; i++) {
			let str = splitByTabs[i];
			
			variableWidthParts.push(["string", str]);
			
			if (i < splitByTabs.length - 1) {
				variableWidthParts.push(["tab", tabWidth - str.length % tabWidth]);
			}
		}
		
		Object.assign(this, {
			startOffset: 0, // this is so that Lines and wrappedLine objects are interchangeable for rendering
			startIndex,
			string,
			trimmed: string.trimLeft(),
			variableWidthParts,
			//withTabsExpanded,
			renderHints: [],
			openers: [],
			closers: [],
			width: withTabsExpanded.length,
			indentLevel,
			indentCols,
			height: 1,
			wrappedLines: undefined,
		});
	}
	
	/*
	generate a set of rendering commands based on the line string, tabs (which
	have to be handled specially because they're variable width -- hence
	variableWidthParts), and any hints provided by the language.
	
	Hints are e.g. "nodes", indicating that a particular range of text contains
	a discrete syntax node that doesn't span multiple lines and can all be
	rendered a particular colour; or "colour" hints, indicating that following
	text should be rendered a particular colour (e.g. "comment").
	
	Ranges of text that aren't covered by hints are rendered in whatever colour
	was last used, which will be set by the previous "node" or "colour" command.
	
	"Hint" is probably too soft a word as the combination of hints and non-hint
	ranges are the fundamental components of the line as far as rendering is
	concerned.
	*/
	
	*render(wrappedLine) {
		let stringStartOffset = wrappedLine.startOffset;
		let offset = 0;
		let hintIndex = 0;
		
		for (let [type, value] of wrappedLine.variableWidthParts) {
			if (type === "string") {
				let string = value;
				
				while (true) {
					/*
					1. render any misc text between the current offset
					and either the next hint or the end of the string
					*/
					
					let nextHint = wrappedLine.renderHints[hintIndex];
					
					if (nextHint && nextHint.offset >= stringStartOffset + string.length) {
						// next hint is not within the current substring, so ignore
						
						nextHint = null;
					}
					
					if (!nextHint && offset - stringStartOffset < string.length) {
						let str = string.substr(offset - stringStartOffset);
						
						yield ["string", str];
						
						offset += str.length;
					}
					
					if (nextHint && nextHint.offset > offset) {
						let str = string.substring(offset - stringStartOffset, nextHint.offset - stringStartOffset);
						
						yield ["string", str];
						
						offset += str.length;
					}
					
					/*
					2. render the next hint
					*/
					
					while (nextHint && nextHint.offset === offset) {
						if (nextHint.type === "node") {
							let {node} = nextHint;
							
							yield ["node", nextHint.node];
							
							offset += node.text.length;
						} else if (nextHint.type === "colour") {
							yield ["colour", nextHint.node];
						}
						
						hintIndex++;
						nextHint = wrappedLine.renderHints[hintIndex];
					}
					
					if (offset === stringStartOffset + string.length) {
						break;
					}
				}
				
				stringStartOffset += string.length;
			} else if (type === "tab") {
				yield [type, value];
				
				offset++;
				stringStartOffset++;
			}
		}
	}
}

module.exports = Line;
