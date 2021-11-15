let throttle = require("utils/throttle");
let sleep = require("utils/sleep");
let AstSelection = require("modules/utils/AstSelection");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let protocol = require("modules/protocol");
let findAndReplace = require("modules/findAndReplace");

let BaseDocument = require("./BaseDocument");
let Source = require("./Source");

let {s} = Selection;
let {c} = Cursor;

class Document extends BaseDocument {
	constructor(code, url=null, options={}) {
		super();
		
		options = {
			project: null,
			fileDetails: null,
			noParse: false,
			...options,
		};
		
		this.url = url;
		this.project = options.project;
		this.fileDetails = options.fileDetails || base.getFileDetails(code, url);
		
		this.source = new Source(code, options.noParse);
		
		this.source.init(this.fileDetails);
		
		this.project?.registerDocument(this);
		
		this.throttledBackup = throttle(() => {
			platform.backup(this);
		}, 15000);
		
		this.fileChangedWhileModified = false;
		
		this.setupWatch();
	}
	
	setFileDetails(fileDetails) {
		this.fileDetails = fileDetails;
		
		this.source.init(this.fileDetails);
		
		this.fire("fileDetailsChanged");
	}
	
	updateFileDetails() {
		this.setFileDetails(base.getFileDetails(this.string, this.url));
	}
	
	setLang(lang) {
		this.setFileDetails({
			...this.fileDetails,
			lang,
		});
	}
	
	get path() {
		return this.url?.path;
	}
	
	get protocol() {
		return this.url?.protocol;
	}
	
	get isSaved() {
		return ["file"].includes(this.protocol);
	}
	
	async save() {
		this.saving = true;
		
		await protocol(this.url).save(this.toString());
		
		this.saving = false;
		this.modified = false;
		this.fileChangedWhileModified = false;
		this.historyIndexAtSave = this.historyIndex;
		
		platform.removeBackup(this);
		
		this.fire("save");
	}
	
	async saveAs(url) {
		this.url = url;
		
		this.updateFileDetails();
		
		await this.save();
		
		this.setupWatch();
	}
	
	setupWatch() {
		if (this.teardownWatch) {
			this.teardownWatch();
			
			delete this.teardownWatch;
		}
		
		if (this.protocol !== "file") {
			return;
		}
		
		this.teardownWatch = platform.fs(this.path).watch(this.onWatchEvent.bind(this));
	}
	
	async onWatchEvent() {
		if (this.saving) {
			return;
		}
		
		let updateEntry = null;
		
		try {
			let file = protocol(this.url);
			
			if (await file.exists()) {
				if (this.modified) {
					this.fileChangedWhileModified = true;
				} else {
					await sleep(50); // read can return blank sometimes otherwise
					
					let code = await file.read();
					let edit = this.edit(this.selectAll(), code);
					
					updateEntry = this.applyAndAddHistoryEntry([edit]);
					
					this.modified = false;
				}
			} else {
				this.fileChangedWhileModified = true;
			}
		} catch (e) {
			this.fileChangedWhileModified = true;
		}
		
		this.fire("fileChanged", updateEntry);
	}
	
	*find(options) {
		let results = findAndReplace.find({
			code: this.string,
			...options,
		});
		
		for (let result of results) {
			yield this.createFindResult(result);
		}
	}
	
	findAll(options) {
		return [...this.find(options)];
	}
	
	replaceAll(options) {
		let document = new Document(this.string, null, {
			noParse: true,
		});
		
		let results = [];
		let edits = [];
		
		for (let result of document.find(options)) {
			edits.push(result.replace(options.replaceWith).edit);
			
			results.push({
				...result,
				document: this,
				replacedLine: this.lines[result.selection.start.lineIndex],
			});
		}
		
		return {
			edits,
			results,
		};
	}
	
	createFindResult(result) {
		let {
			index,
			match,
			groups,
			replace,
			loopedFile,
			loopedResults,
		} = result;
		
		let cursor = this.cursorFromIndex(index);
		let selection = s(cursor, this.cursorFromIndex(index + match.length));
		
		return {
			document: this,
			index,
			cursor,
			selection,
			match,
			groups,
			loopedFile,
			loopedResults,
			
			replace: (str) => {
				str = replace(str);
				
				let {edit, newSelection} = this.replaceSelection(selection, str);
				let entry = this.applyAndAddHistoryEntry([edit]);
				
				return {
					edit,
					newSelection,
					entry,
				};
			},
		};
	}
	
	langFromLineIndex(lineIndex) {
		let line = this.lines[lineIndex];
		
		return this.langFromCursor(c(lineIndex, line.indentOffset));
	}
	
	langFromAstSelection(astSelection) {
		let {startLineIndex} = astSelection;
		let line = this.lines[startLineIndex];
		
		return this.langFromCursor(c(startLineIndex, line.indentOffset));
	}
	
	scopeFromCursor(cursor) {
		return this.source.scopeFromCursor(cursor);
	}
	
	langFromCursor(cursor) {
		return this.source.langFromCursor(cursor);
	}
	
	getDecoratedLines(startLineIndex, endLineIndex) {
		return this.source.getDecoratedLines(startLineIndex, endLineIndex);
	}
	
	findFirstNodeToRender(lineIndex) {
		return this.source.findFirstNodeToRender(lineIndex);
	}
	
	getNodesOnLine(lineIndex) {
		return [...this.source.generateNodesOnLine(lineIndex)];
	}
	
	getNodesOnLineWithLang(lineIndex) {
		return [...this.source.generateNodesOnLineWithLang(lineIndex)];
	}
	
	generateNodesOnLine(lineIndex) {
		return this.source.generateNodesOnLine(lineIndex);
	}
	
	generateNodesOnLineWithLang(lineIndex) {
		return this.source.generateNodesOnLineWithLang(lineIndex);
	}
	
	generateNodesFromCursorWithLang(cursor) {
		return this.source.generateNodesFromCursorWithLang(cursor);
	}
	
	getHeadersOnLine(lineIndex) {
		return this.source.getHeadersOnLine(lineIndex);
	}
	
	getFootersOnLine(lineIndex) {
		return this.source.getFootersOnLine(lineIndex);
	}
}

module.exports = Document;
