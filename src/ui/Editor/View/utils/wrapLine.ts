import regexMatch from "utils/regexMatch";
import type {IndentationDetails} from "core";
import type ViewLine, {VariableWidthPart} from "../ViewLine";

export type LineRow = {
	startOffset: number;
	string: string;
	width: number;
	variableWidthParts: VariableWidthPart[];
};

export type WrappedLine = {
	viewLine: ViewLine;
	line: Line;
	height: number;
	lineRows: LineRow[];
};

let endWordRe = /[\S\w]+\s*$/;
let wordRe = /[\S\w]+\s*/g;

class LineWrapper {
	private viewLine: ViewLine;
	private indentation: IndentationDetails;
	private measurements: any; // TYPE
	private availableWidth: number;
	
	private screenCols: number;
	private textCols: number;
	private offset: number;
	
	constructor(viewLine: ViewLine, indentation: IndentationDetails, measurements, availableWidth) {
		this.viewLine = viewLine;
		this.indentation = indentation;
		this.measurements = measurements;
		this.availableWidth = availableWidth;
		
		this.screenCols = Math.floor(availableWidth / measurements.colWidth);
		this.textCols = this.screenCols - viewLine.line.indentCols;
		this.offset = 0;
	}
	
	requiresWrapping() {
		if (this.availableWidth < this.measurements.colWidth) {
			return false;
		}
		
		if (this.viewLine.width <= this.screenCols) {
			return false;
		}
		
		if (this.textCols < this.indentation.colsPerIndent) {
			return false;
		}
		
		return true;
	}
	
	unwrapped() {
		let {viewLine} = this;
		let {line, width, variableWidthParts} = viewLine;
		let {string} = line;
		
		return {
			viewLine,
			line,
			height: 1,
			lineRows: [
				{
					startOffset: 0,
					string,
					width,
					variableWidthParts,
				},
			],
		};
	}
	
	init() {
		this.lineRows = [{
			startOffset: 0,
			string: "",
			width: 0,
			variableWidthParts: [],
		}];
		
		this.startOffset = 0;
		this.availableCols = this.screenCols;
		this.currentlyAvailableCols = this.availableCols;
	}
	
	nextRow() {
		this.lineRows.push({
			startOffset: this.offset,
			string: "",
			width: 0,
			variableWidthParts: [],
		});
		
		this.availableCols = this.textCols;
		this.currentlyAvailableCols = this.availableCols;
	}
	
	get currentLineRow() {
		return this.lineRows.at(-1);
	}
	
	addTabToCurrentRow(part) {
		let lineRow = this.currentLineRow;
		
		lineRow.string += "\t";
		lineRow.width += part.width;
		lineRow.variableWidthParts.push(part);
		
		this.currentlyAvailableCols -= part.width;
		this.offset++;
	}
	
	addStringToCurrentLineRow(string) {
		let lineRow = this.currentLineRow;
		
		lineRow.string += string;
		lineRow.width += string.length;
		
		lineRow.variableWidthParts.push({
			offset: this.offset,
			type: "string",
			string,
			width: string.length,
		});
		
		this.currentlyAvailableCols -= string.length;
		this.offset += string.length;
	}
	
	wrap(wrap, isFoldHeader) {
		if (isFoldHeader || !wrap || !this.requiresWrapping()) {
			return this.unwrapped();
		}
		
		this.init();
		
		for (let part of this.viewLine.variableWidthParts) {
			if (part.type === "tab") {
				if (part.width > this.currentlyAvailableCols) {
					this.nextRow();
				}
				
				this.addTabToCurrentRow(part);
			} else {
				let {string} = part;
				
				while (string) {
					let toEnd = string.substr(0, this.currentlyAvailableCols);
					let overflow = string.substr(toEnd.length);
					let endWord = regexMatch(toEnd, endWordRe);
					
					if (endWord) {
						wordRe.lastIndex = toEnd.length - endWord.length;
						
						let [fullWord] = wordRe.exec(string);
						
						if (fullWord.length > endWord.length) {
							toEnd = toEnd.substr(0, toEnd.length - endWord.length);
							
							if (toEnd) {
								overflow = endWord + overflow;
							} else {
								toEnd = endWord;
								overflow = string.substr(toEnd.length);
							}
						}
					}
					
					if (toEnd) {
						this.addStringToCurrentLineRow(toEnd);
					}
					
					if (overflow) {
						this.nextRow();
					}
					
					string = overflow;
				}
			}
		}
		
		return this.result();
	}
	
	result() {
		let {viewLine, lineRows} = this;
		
		return {
			viewLine,
			line: viewLine.line,
			height: lineRows.length,
			lineRows,
		};
	}
}

export default function(
	wrap: boolean,
	viewLine: ViewLine,
	isFoldHeader: boolean,
	indentation,
	measurements,
	availableWidth: number,
) {
	let wrapper = new LineWrapper(viewLine, indentation, measurements, availableWidth);
	
	return wrapper.wrap(wrap, isFoldHeader);
}
