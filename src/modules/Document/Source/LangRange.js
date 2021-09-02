let advanceCursor = require("./utils/treeSitter/advanceCursor");
let rangeToTreeSitterRange = require("./utils/treeSitter/rangeToTreeSitterRange");
let treeSitterRangeToRange = require("./utils/treeSitter/treeSitterRangeToRange");
let cursorToTreeSitterPoint = require("./utils/treeSitter/cursorToTreeSitterPoint");

module.exports = class LangRange {
	constructor(lang, code, range) {
		this.lang = lang;
		this.code = code;
		this.range = range;
		this.treeSitterRange = rangeToTreeSitterRange(range);
		
		this.langRanges = [];
		this.langRangesByCursor = {};
		this.langRangesByNode = new WeakMap();
		
		this.parse();
	}
	
	parse() {
		let parser = new TreeSitter();
		
		parser.setLanguage(base.getTreeSitterLanguage(this.lang.code));
		
		this.tree = parser.parse(this.code, null, {
			includedRanges: [this.treeSitterRange],
		});   
		
		let cursor = this.tree.walk();
		
		while (true) {
			let node = cursor.currentNode();
			let injectionLang = this.getInjectionLang(node);
			
			if (injectionLang) {
				let langRange = new LangRange(injectionLang, this.code, treeSitterRangeToRange(node));
				
				this.langRanges.push(langRange);
				this.langRangesByCursor[node.startPosition.row + "," + node.startPosition.column] = langRange;
				this.langRangesByNode.set(node, langRange);
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
	
	edit(edit, index, code) {
		let {
			selection,
			newSelection,
			string,
			replaceWith,
		} = edit;
		
		this.code = code;
		
		
		
		let parser = new TreeSitter();
		
		parser.setLanguage(base.getTreeSitterLanguage(this.lang.code));
		
		this.tree.edit({
			startPosition: cursorToTreeSitterPoint(selection.start),
			startIndex: index,
			oldEndPosition: cursorToTreeSitterPoint(selection.end),
			oldEndIndex: index + string.length,
			newEndPosition: cursorToTreeSitterPoint(newSelection.end),
			newEndIndex: index + replaceWith.length,
		});
		
		this.tree = parser.parse(this.code, this.tree, {
			includedRanges: [this.treeSitterRange],
		});
		
		
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
			
			let openerAndCloser = this.getOpenerAndCloser(node);
			let childRange = this.langRangesByNode.get(node);
			
			line.renderHints.push(...this.getRenderHints(node));
			
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
			
			if (childRange) {
				childRange.decorateLines(lines);
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
	
	getRenderHints(node) {
		if (node.type === "ERROR") {
			return [{
				type: "parseError",
				offset: node.startPosition.column,
				lang: this.lang,
				node,
			}];
		}
		
		return this.lang.generateRenderHints(node);
	}
	
	getOpenerAndCloser(node) {
		if (node.type === "ERROR" || node.startPosition.row === node.endPosition.row) {
			return null;
		}
		
		return this.lang.getOpenerAndCloser(node);
	}
	
	getInjectionLang(node) {
		if (node.text.length === 0) {
			return null;
		}
		
		let injectionLangCode = this.lang.getInjectionLang(node);
			
		if (!injectionLangCode) {
			return null;
		}
		
		return base.langs.get(injectionLangCode);
	}
}
