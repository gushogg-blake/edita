module.exports = {
	snippetEditor(el, dialogOptions, onClose) {
		let snippet = platform.snippets.findById(dialogOptions.snippetId);
		
		let snippetEditor = new base.components.SnippetEditor({
			target: el,
			
			props: {
				snippet,
			},
		});
		
		snippetEditor.$on("save", onClose);
	},
	
	findAndReplace(el, dialogOptions, onClose) {
	},
};
