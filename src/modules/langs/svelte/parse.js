module.exports = async function() {
	let parser = new TreeSitter();
	let Svelte = await platform.loadTreeSitterLanguage("svelte");
	
	parser.setLanguage(Svelte);
	
	return function(code, lines, fileDetails) {
		
	}
}
