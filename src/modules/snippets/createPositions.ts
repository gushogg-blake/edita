import Selection from "modules/Selection";
import Cursor from "modules/Cursor";
import Document from "modules/Document";
import getPlaceholders from "./getPlaceholders";

let {s} = Selection;
let {c} = Cursor;

function getReplacedString(string, placeholders) {
	let replacedString = "";
	let prevPlaceholderEnd = 0;
	
	for (let placeholder of placeholders) {
		replacedString += string.substring(prevPlaceholderEnd, placeholder.start);
		
		prevPlaceholderEnd = placeholder.end;
	}
	
	replacedString += string.substr(prevPlaceholderEnd);
	
	return replacedString;
}

export default function(string, baseLineIndex=0, baseOffset=0) {
	let placeholders = getPlaceholders(string);
	let replacedString = getReplacedString(string, placeholders);
	
	let indexOffset = 0;
	let document = new Document(replacedString);
	
	let positions = [];
	let tabstops = [];
	let firstTabstopIndex = null;
	
	for (let i = 0; i < placeholders.length; i++) {
		let placeholder = placeholders[i];
		let indexInReplacedString = placeholder.start - indexOffset;
		
		indexOffset += placeholder.end - placeholder.start;
		
		let {lineIndex, offset} = document.cursorFromIndex(indexInReplacedString);
		
		let cursor = c(
			baseLineIndex + lineIndex,
			lineIndex === 0 ? baseOffset + offset : offset,
		);
		
		let position = {
			placeholder,
			selection: s(cursor),
		};
		
		positions.push(position);
		
		if (placeholder.type === "tabstop") {
			tabstops.push(position);
			
			if (firstTabstopIndex === null) {
				firstTabstopIndex = i;
			}
		}
	}
	
	return {
		replacedString,
		positions,
		tabstops,
		firstTabstopIndex,
	};
}
