/*
generate a set of rendering commands based on the line string, tabs (which
have to be handled specially because they're variable width -- hence
variableWidthParts), and any hints provided by the language.

Hints have node and lang properties, which set the colour, and optionally
string, which renders the string.

The resulting commands are either hints, plain {string}s, or tabs (which have
explicit width to be used instead of the string length for incrementing the
x position when rendering)
*/

function getOffset(hint) {
	return ("offset" in hint) ? hint.offset : hint.node.startPosition.column;
}

module.exports = function*(line, renderHints) {
	let stringStartOffset = 0;
	let offset = 0;
	let hintIndex = 0;
	
	for (let part of line.variableWidthParts) {
		if (part.type === "string") {
			let {string} = part;
			
			while (true) {
				/*
				1. render any misc text between the current offset
				and either the next hint or the end of the string
				*/
				
				let nextHint = renderHints[hintIndex];
				let nextHintOffset = nextHint && getOffset(nextHint);
				
				if (nextHint && nextHintOffset >= stringStartOffset + string.length) {
					// next hint is not within the current string part, so ignore
					
					nextHint = null;
				}
				
				if (!nextHint && offset - stringStartOffset < string.length) {
					let str = string.substr(offset - stringStartOffset);
					
					yield {
						string: str,
					};
					
					offset += str.length;
				}
				
				if (nextHint && nextHintOffset > offset) {
					let str = string.substring(offset - stringStartOffset, nextHintOffset - stringStartOffset);
					
					yield {
						string: str,
					};
					
					offset += str.length;
				}
				
				/*
				2. render the next hint
				*/
				
				while (nextHint && getOffset(nextHint) === offset) {
					yield nextHint;
					
					if (nextHint.string) {
						offset += nextHint.string.length;
					}
					
					hintIndex++;
					nextHint = renderHints[hintIndex];
				}
				
				if (offset === stringStartOffset + string.length) {
					break;
				}
			}
			
			stringStartOffset += string.length;
		} else if (part.type === "tab") {
			yield {
				width: part.width,
				string: "\t",
			};
			
			offset++;
			stringStartOffset++;
		}
	}
}
