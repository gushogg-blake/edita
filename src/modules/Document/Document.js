let throttle = require("utils/throttle");
let sleep = require("utils/sleep");
let Evented = require("utils/Evented");
let AstSelection = require("modules/AstSelection");
let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");
let protocol = require("modules/protocol");
let findAndReplace = require("modules/findAndReplace");

let Source = require("./Source");
let Line = require("./Line");

let {s} = Selection;
let {c} = Cursor;

class Document extends Evented {
	constructor(string, url=null, options={}) {
		super();
		
		options = {
			project: null,
			format: base.getFormat(string, url),
			noParse: false,
			...options,
		};
		
		this.string = string;
		this.url = url;
		this.format = options.format;
		this.project = options.project;
		this.noParse = options.noParse;
		
		this.history = [];
		this.historyIndex = 0;
		this.historyIndexAtSave = 0;
		this.modified = false;
		
		this.createLines();
		
		this.source = new Source(this);
		
		this.source.parse();
		
		this.throttledBackup = throttle(() => {
			platform.backup(this);
		}, 15000);
		
		this.on("edit", this.throttledBackup);
		
		this.fileChangedWhileModified = false;
		
		this.setupWatch();
	}
	
	static maxEditsToApplyIndividually = 2;
	
	get lang() {
		return this.format.lang;
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
	
	get scopes() {
		return this.source.scopes;
	}
	
	createLines() {
		this.lines = [];
		
		let {format} = this;
		let lineStrings = this.string.split(format.newline);
		let lineStartIndex = 0;
		
		for (let i = 0; i < lineStrings.length; i++) {
			let lineString = lineStrings[i];
			
			this.lines.push(new Line(lineString, format, lineStartIndex, i));
			
			lineStartIndex += lineString.length + format.newline.length;
		}
	}
	
	edit(selection, replaceWith) {
		selection = selection.sort();
		
		let currentStr = this.getSelectedText(selection);
		let {start, end} = selection;
		
		let prefix = this.lines[start.lineIndex].string.substr(0, start.offset);
		let suffix = this.lines[end.lineIndex].string.substr(end.offset);
		
		let insertLines = replaceWith.split(this.format.newline);
		
		insertLines[0] = prefix + insertLines[0];
		insertLines[insertLines.length - 1] += suffix;
		
		let newEndLineIndex = start.lineIndex + insertLines.length - 1;
		let lastLine = insertLines.at(-1);
		let newSelection = s(start, c(newEndLineIndex, lastLine.length - suffix.length));
		
		return {
			selection,
			string: currentStr,
			replaceWith,
			newSelection,
		};
	}
	
	lineEdit(lineIndex, removeLinesCount, insertLines) {
		let {newline} = this.format;
		
		let endLineIndex = lineIndex + removeLinesCount;
		let insertString = insertLines.join(newline);
		let start;
		let end;
		
		/*
		removing/inserting at the last line needs special handling as the
		last line doesn't end with a newline
		*/
		
		if (lineIndex === this.lines.length) {
			start = c(lineIndex - 1, this.lines.at(-1).string.length);
			
			if (insertLines.length > 0) {
				insertString = newline + insertString;
			}
		} else {
			start = c(lineIndex, 0);
		}
		
		if (endLineIndex === this.lines.length) {
			end = c(endLineIndex - 1, this.lines[endLineIndex - 1].string.length);
		} else {
			end = c(endLineIndex, 0);
			
			if (insertLines.length > 0) {
				insertString += newline;
			}
		}
		
		return this.edit(s(start, end), insertString);
	}
	
	astEdit(astSelection, insertLines) {
		let {startLineIndex, endLineIndex} = astSelection;
		
		return this.lineEdit(startLineIndex, endLineIndex - startLineIndex, insertLines);
	}
	
	_apply(edit) {
		let {selection, string, replaceWith} = edit;
		let index = this.indexFromCursor(selection.left);
		
		this.string = this.string.substr(0, index) + replaceWith + this.string.substr(index + string.length);
		
		this.createLines();
		
		return index;
	}
	
	apply(edit) {
		let index = this._apply(edit);
		
		this.source.edit(edit, index);
		
		this.modified = true;
		
		this.fire("edit", [edit]);
	}
	
	reverse(edit) {
		let {
			selection,
			string,
			newSelection,
			replaceWith,
		} = edit;
		
		return {
			selection: newSelection,
			string: replaceWith,
			newSelection: selection,
			replaceWith: string,
		};
	}
	
	reverseEdits(edits) {
		return [...edits].reverse().map(edit => this.reverse(edit));
	}
	
	applyEdits(edits) {
		if (edits.length <= Document.maxEditsToApplyIndividually) {
			for (let edit of edits) {
				this.apply(edit);
			}
		} else {
			for (let edit of edits) {
				this._apply(edit);
			}
			
			this.source.parse();
			
			this.modified = true;
			
			this.fire("edit", edits);
		}
	}
	
	applyAndAddHistoryEntry(edits) {
		let undo = this.reverseEdits(edits);
		
		this.applyEdits(edits);
		
		let entry = {
			undo,
			redo: edits,
		};
		
		if (this.historyIndex < this.history.length) {
			this.history.splice(this.historyIndex, this.history.length - this.historyIndex);
		}
		
		this.history.push(entry);
		this.historyIndex = this.history.length;
		
		return entry;
	}
	
	applyAndMergeWithLastHistoryEntry(edits) {
		let entry = this.history.at(-1);
		
		this.applyEdits(edits);
		
		entry.redo = [...entry.redo, ...edits];
		entry.undo = [...this.reverseEdits(edits), ...entry.undo];
		
		return entry;
	}
	
	undo() {
		if (this.historyIndex === 0) {
			return null;
		}
		
		let entry = this.history[this.historyIndex - 1];
		
		this.historyIndex--;
		this.applyEdits(entry.undo);
		
		if (this.historyIndex === this.historyIndexAtSave) {
			this.modified = false;
		}
		
		this.fire("undo", entry);
		
		return entry;
	}
	
	redo() {
		if (this.historyIndex === this.history.length) {
			return null;
		}
		
		let entry = this.history[this.historyIndex];
		
		this.historyIndex++;
		this.applyEdits(entry.redo);
		
		if (this.historyIndex === this.historyIndexAtSave) {
			this.modified = false;
		}
		
		this.fire("redo", entry);
		
		return entry;
	}
	
	replaceSelection(selection, string) {
		let edit = this.edit(selection, string);
		let newSelection = s(edit.newSelection.end);
		
		return {
			edit,
			newSelection,
		};
	}
	
	insert(selection, ch) {
		return this.replaceSelection(selection, ch);
	}
	
	move(fromSelection, toCursor) {
		let str = this.getSelectedText(fromSelection);
		let remove = this.edit(fromSelection, "");
		let insert = this.edit(s(toCursor), str);
		
		let newSelection = this.getSelectionContainingString(toCursor, str);
		
		newSelection = newSelection.subtractEarlierSelection(fromSelection);
		
		let edits;
		
		if (toCursor.isBefore(fromSelection.start)) {
			edits = [remove, insert];
		} else {
			edits = [insert, remove];
		}
		
		return {
			edits,
			newSelection,
		};
	}
	
	indexFromCursor(cursor) {
		return this.source.indexFromCursor(cursor);
	}
	
	cursorFromIndex(index) {
		return this.source.cursorFromIndex(index);
	}
	
	getSelectedLines(astSelection) {
		return astSelection.getSelectedLines(this.lines);
	}
	
	getAstSelection(astSelection) {
		return AstSelection.linesToSelectionLines(this.getSelectedLines(astSelection));
	}
	
	getSelectedText(selection) {
		let {left, right} = selection;
		let lines = this.lines.slice(left.lineIndex, right.lineIndex + 1);
		
		let str = lines.map(line => line.string).join(this.format.newline);
		let trimLeft = left.offset;
		let trimRight = lines.at(-1).string.length - right.offset;
		
		return str.substring(trimLeft, str.length - trimRight);
	}
	
	getSelectionContainingString(cursor, str) {
		return Selection.containString(cursor, str, this.format.newline);
	}
	
	wordAtCursor(cursor) {
		let {lineIndex, offset} = cursor;
		
		let line = this.lines[lineIndex];
		let stringToCursor = line.string.substr(0, offset);
		let stringFromCursor = line.string.substr(offset);
		
		let left = stringToCursor.match(/\w+$/)?.[0] || "";
		let right = stringFromCursor.match(/^\w+/)?.[0] || "";
		
		return {left, right};
	}
	
	getLongestLineWidth() {
		let width = 0;
		
		for (let line of this.lines) {
			if (line.width > width) {
				width = line.width;
			}
		}
		
		return width;
	}
	
	cursorAtEnd() {
		return c(this.lines.length - 1, this.lines.at(-1).string.length);
	}
	
	cursorAtStartOfLineContent(lineIndex) {
		return c(lineIndex, this.lines[lineIndex].indentOffset);
	}
	
	cursorAtEndOfLine(lineIndex) {
		return c(lineIndex, this.lines[lineIndex].string.length);
	}
	
	selectAll() {
		return s(c(0, 0), this.cursorAtEnd());
	}
	
	cursorWithinBounds(cursor) {
		cursor = Cursor.max(cursor, Cursor.start());
		cursor = Cursor.min(cursor, this.cursorAtEnd());
		
		return cursor;
	}
	
	setFormat(format) {
		this.format = format;
		
		this.source.parse();
		
		this.fire("formatChanged");
	}
	
	setUrl(url) {
		this.url = url;
		
		this.updateFormat();
	}
	
	updateFormat() {
		this.setFormat(base.getFormat(this.string, this.url));
	}
	
	setLang(lang) {
		this.setFormat({
			...this.format,
			lang,
		});
	}
	
	setProject(project) {
		this.project = project;
		
		this.fire("projectChanged");
	}
	
	async save() {
		this.saving = true;
		
		await protocol(this.url).save(this.toString());
		
		this.saving = false;
		this.modified = false;
		this.fileChangedWhileModified = false;
		this.historyIndexAtSave = this.historyIndex;
		
		platform.removeBackup(this);
		
		this.updateFormat();
		
		this.fire("save");
	}
	
	async saveAs(url) {
		let oldUrl = this.url;
		
		this.url = url;
		
		await this.save();
		
		if (this.url !== oldUrl) {
			this.fire("urlChanged");
		}
		
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
	
	getVisibleScopes(selection) {
		return this.source.getVisibleScopes(selection);
	}
	
	rangeFromCursor(cursor) {
		return this.source.rangeFromCursor(cursor);
	}
	
	rangeFromCharCursor(cursor) {
		return this.source.rangeFromCharCursor(cursor);
	}
	
	langFromCursor(cursor) {
		return this.source.langFromCursor(cursor);
	}
	
	generateNodesOnLine(lineIndex, lang=null) {
		return this.source.generateNodesOnLine(lineIndex, lang);
	}
	
	getNodesOnLine(lineIndex, lang=null) {
		return [...this.generateNodesOnLine(lineIndex, lang)];
	}
	
	getNodeAtCursor(cursor) {
		return this.source.getNodeAtCursor(cursor);
	}
	
	toString() {
		return this.string;
	}
	
	teardown() {
		if (this.teardownWatch) {
			this.teardownWatch();
		}
	}
}

module.exports = Document;
