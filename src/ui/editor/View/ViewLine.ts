import {expandTabs} from "modules/utils/editing";
import type {Line} from "core/Document";
import type {Format} from "core";

/*
a Line with extra info about tabs for rendering
*/

export type VariableWidthPart = {
	offset: number;
	type: "string" | "tab";
	string: string;
	width: number;
};

export default class ViewLine {
	line: Line;
	variableWidthParts: VariableWidthPart[];
	width: number;
	
	constructor(line: Line, format: Format) {
		this.line = line;
		this.width = expandTabs(line.string, format).length;
		
		this.createVariableWidthParts(format);
	}
	
	createVariableWidthParts(format: Format) {
		let {string} = this.line;
		let {tabWidth} = format.indentation;
		let splitByTabs = string.split("\t");
		
		this.variableWidthParts = [];
		
		let offset = 0;
		
		for (let i = 0; i < splitByTabs.length; i++) {
			let str = splitByTabs[i];
			
			/*
			always have at least one empty string so that an empty line
			has a single empty variable-width part
			*/
			
			if (str || i === 0) {
				this.variableWidthParts.push({
					offset,
					type: "string",
					string: str,
					width: str.length,
				});
				
				offset += str.length;
			}
			
			if (i < splitByTabs.length - 1) {
				this.variableWidthParts.push({
					offset,
					type: "tab",
					string: "\t",
					width: tabWidth - str.length % tabWidth,
				});
				
				offset++;
			}
		}
	}
}
