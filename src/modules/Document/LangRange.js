let advanceCursor = require("./utils/treeSitter/advanceCursor");
let rangeToTreeSitterRange = require("./utils/treeSitter/rangeToTreeSitterRange");
let treeSitterRangeToRange = require("./utils/treeSitter/treeSitterRangeToRange");

module.exports = class LangRange {
	constructor(lang, code, range) {
		this.lang = lang;
		this.code = code;
		this.range = range;
		this.treeSitterRange = treeSitterRangeToRange(range);
		
		this.langRanges = [];
		this.langRangesByCursor = {};
		this.langRangesByNode = new WeakMap();
		
		this.parse();
	}
	
	parse() {
		let parser = new TreeSitter();
		
		parser.setLanguage(base.getTreeSitterParser(this.lang.code));
		
		this.tree = parser.parse(this.code, null, {
			includedRanges: [this.treeSitterRange],
		});
		
		let cursor = this.tree.walk();
		
		while (true) {
			let node = cursor.currentNode();
			let injectionLangCode = this.lang.getInjectionLang(node);
			
			if (injectionLangCode) {
				let injectionLang = base.langs.get(injectionLangCode);
				
				if (injectionLang) {
					let langRange = new LangRange(injectionLang, this.code, treeSitterRangeToRange(node));
					
					
				}
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
	
	edit(edit, code) {
		
	}
	
	decorateLines(lines) {
		let {lang} = this;
		let cursor = this.tree.walk();
		
		while (true) {
			let node = cursor.currentNode();
			
			if (node === this.tree.rootNode) {
				if (!advanceCursor(cursor)) {
					break;
				}
				
				continue;
			}
			
			let line = lines[node.startPosition.row];
			
			line.nodes.push(node);
			
			if (node.type === "ERROR") {
				line.renderHints.push({
					type: "parseError",
					offset: startOffset,
					lang,
					node,
				});
			} else {
				let renderHint = lang.getRenderHint(node);
				let openerAndCloser = lang.getOpenerAndCloser(node);
				
				if (renderHint) {
					line.renderHints.push(renderHint);
				}
				
				if (openerAndCloser) {
					let {opener, closer} = openerAndCloser;
					
					lines[opener.startPosition.row].openers.push({
						lang,
						node: opener,
					});
					
					lines[closer.startPosition.row].closers.unshift({
						lang,
						node: closer,
					});
				}
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
	
}
