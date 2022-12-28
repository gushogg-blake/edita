class Lang {
	constructor(lang) {
		Object.assign(this, lang);
	}
	
	async initTreeSitterLanguage() {
		let treeSitterLanguage = await platform.loadTreeSitterLanguage(this.code);
		
		this.treeSitterLanguage = treeSitterLanguage;
		
		// tree-sitter query creation is slow so pre-create them
		
		this.injections = (lang.injections || []).map((injection) => {
			return {
				...injection,
				query: this.query(injection.pattern),
			};
		});
		
		this.queries = {
			error: treeSitterLanguage.query("(ERROR) @error"),
		};
	}
	
	query(string) {
		return this.treeSitterLanguage.query(string);
	}
}

module.exports = Lang;
