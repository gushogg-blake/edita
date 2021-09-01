

class Code {
	constructor(string) {
		//this.lang = lang;
		this.string = string;
		this.rootRange = null;
	}
	
	setLang(lang) {
		this.lang = lang;
		this.rootRange = null;
		//this.parse();
	}
	
	parse() {
		// generate the whole tree
	}
	
	edit(selection, replaceWith) {
		// edit the tree
	}
	
	createRange() {
		
	}
}
