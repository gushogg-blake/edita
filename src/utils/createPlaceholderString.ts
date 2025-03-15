/*
generate a placeholder that doesn't appear in the given string
*/

export default function(string) {
	let placeholder;
	let n = 0;
	
	do {
		placeholder = "PLACEHOLDER_" + (++n);
	} while (string.indexOf(placeholder) !== -1);
	
	return placeholder;
}
