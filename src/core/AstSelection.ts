import type {AstSelectionContents} from "core";

function s(startLineIndex, endLineIndex=null) {
	return new AstSelection(startLineIndex, endLineIndex);
}

export {s as a};

export default class AstSelection {
	startLineIndex: number;
	endLineIndex: number;
	
	constructor(startLineIndex: number, endLineIndex: number) {
		this.startLineIndex = startLineIndex;
		this.endLineIndex = endLineIndex || startLineIndex;
	}
	
	isFull() {
		return this.startLineIndex !== this.endLineIndex;
	}
	
	equals(selection: AstSelection) {
		return this.startLineIndex === selection.startLineIndex && this.endLineIndex === selection.endLineIndex;
	}
	
	isWithin(selection: AstSelection) {
		return this.startLineIndex >= selection.startLineIndex && this.endLineIndex <= selection.endLineIndex;
	}
	
	isNextTo(selection: AstSelection) {
		return this.startLineIndex === selection.endLineIndex || selection.startLineIndex === this.endLineIndex;
	}
	
	containsLineIndex(lineIndex: number) {
		return lineIndex >= this.startLineIndex && lineIndex < this.endLineIndex;
	}
	
	getSelectedLines(lines: Line[]) {
		return lines.slice(this.startLineIndex, this.endLineIndex);
	}
	
	static s = s;
	
	/*
	insertion range - given line indexes above and below the mouse, and the
	mouse's distance from the middle of the line it's on, calculate where the
	selection should be dropped.
	
	- if the mouse is between two non-blank lines, the selection should be
	  dropped between the lines, and no new whitespace should be created
	
	- if the mouse is between a non-blank line and a blank line, and is not
	  "fully" on the blank line (determined by a threshold), the selection
	  should be dropped between the two lines (same as above)
	
	- if the mouse is fully on a blank line, the selection should be dropped
	  within the blank space, and more whitespace should be created so that
	  there is a space equal to the original amount of whitespace either side
	  of the dropped selection
	
	when dropping between lines (no new whitespace), the returned range is
	zero-length
	
	when dropping onto whitespace, the returned range encloses all the blank
	lines
	*/
	
	static insertionRange(
		lines: Line[],
		aboveLineIndex: number,
		belowLineIndex: number,
		offset: number,
	): AstSelection {
		if (aboveLineIndex === null) {
			return s(0);
		}
		
		if (belowLineIndex === null) {
			return s(aboveLineIndex + 1);
		}
		
		if (aboveLineIndex === belowLineIndex) {
			return s(offset < 0 ? aboveLineIndex : aboveLineIndex + 1);
		}
		
		let line = offset <= 0 ? lines[belowLineIndex] : lines[aboveLineIndex];
		let other = offset <= 0 ? lines[aboveLineIndex] : lines[belowLineIndex];
		let isInWhiteSpace = line.isBlank;
		let otherIsWhiteSpace = other.isBlank;
		
		/*
		if we're only just on the blank next to a non-blank line,
		allow a buffer to make it easier to place things next to blank
		lines
		*/
		
		if (isInWhiteSpace && !otherIsWhiteSpace) {
			if (Math.abs(offset) > 0.8) {
				isInWhiteSpace = false;
			}
		}
		
		if (!isInWhiteSpace) {
			return s(aboveLineIndex + 1);
		}
		
		let start = aboveLineIndex + 1;
		let end = start;
		
		while (lines[start - 1] && lines[start - 1].isBlank) {
			start--;
		}
		
		while (lines[end] && lines[end].isBlank) {
			end++;
		}
		
		return s(start, end);
	}
	
	/*
	linesToSelectionContents/selectionContentsToStrings:
	
	The contents of an AST selection is an array of [indentLevel, trimmedString]
	pairs representing the lines ("selection lines").  These two functions convert
	between arrays of Document lines, strings, and selection lines.
	*/
	
	static linesToSelectionContents(lines: Line[]): AstSelectionContents {
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		
		return lines.map(function(line) {
			return {indent: line.indentLevel - minIndentLevel, string: line.trimmed};
		});
	}
	
	static selectionContentsToStrings(
		selectionContents: AstSelectionContents,
		indentStr: string,
		indent: number = 0,
	): string[] {
		return selectionContents.map(function({indent, string}) {
			return indentStr.repeat(indent + indentLevel) + string;
		});
	}
}
