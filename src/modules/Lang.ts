class Lang {
	constructor(lang) {
		Object.assign(this, lang);
	}
	
	async initTreeSitterLanguage() {
		this.treeSitterLanguage = await platform.loadTreeSitterLanguage(this.code);
		
		// tree-sitter query creation is slow so pre-create them
		
		this.injections = (this.injections || []).map((injection) => {
			return {
				...injection,
				query: this.query(injection.pattern),
			};
		});
		
		this.queries = {
			error: this.query("(ERROR) @error"),
		};
	}
	
	query(string) {
		return this.treeSitterLanguage.query(string);
	}
}

export default Lang;
