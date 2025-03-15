import checkNewlines from "modules/utils/checkNewlines";

export default function(str) {
	let {
		mostCommon,
		mixed,
	} = checkNewlines(str);
	
	if (mixed) {
		throw new Error("String has mixed newlines");
	}
	
	return mostCommon;
}
