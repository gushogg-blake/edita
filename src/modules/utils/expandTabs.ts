export default function(string) {
	let {tabWidth} = base.prefs;
	
	let colsAdded = 0;
	
	return string.replaceAll("\t", function(_, index) {
		let size = tabWidth - (index + colsAdded) % tabWidth;
		
		colsAdded += size - 1;
		
		return " ".repeat(size);
	});
}
