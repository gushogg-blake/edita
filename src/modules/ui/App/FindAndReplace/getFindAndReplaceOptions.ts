export default function(options) {
	let {
		search,
		replaceWith,
		regex,
		caseMode,
		word,
		//multiline,
	} = options;
	
	return {
		search,
		replaceWith,
		type: regex ? "regex" : "plain",
		caseMode,
		word,
		enumerate: true,
	};
}
