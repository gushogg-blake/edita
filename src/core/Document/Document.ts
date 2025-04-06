import {Evented} from "utils";
import {AstSelection, a, Selection, s, Cursor, c} from "core";
import {type Resource, File, Memory} from "core/resource";
import findAndReplace from "modules/grep/findAndReplace";

import Source from "./Source";
import Line from "./Line";
import Edit from "./Edit";
//import Action from "./Action";
import HistoryEntry from "./HistoryEntry";

export {default as Line} from "./Line";
export {default as Range} from "./Source/Range";
export {default as Scope} from "./Source/Scope";

export type {Edit, HistoryEntry};

export type DocumentOptions = {
	noParse: boolean;
};

export type LineDiff = {
	startLineIndex: number;
	invalidCount: number;
	newLines: Line[];
};

export type AppliedEdit = {
	edit: Edit;
	index: number;
	lineDiff: LineDiff;
};

export type WordAtCursor = {
	left: string;
	right: string;
};

export default class Document extends Evented<{
	edit: AppliedEdit[];
	undo: HistoryEntry;
	redo: HistoryEntry;
	historyEntryAdded: HistoryEntry;
	save: void;
	resourceChanged: void;
}> {
	resource: Resource;
	string: string;
	lines: Line[];
	history: HistoryEntry[] = [];
	historyIndex: number = 0;
	modified: boolean;
	fileChangedWhileModified: boolean = false;
	noParse: boolean;
	
	private source: Source;
	private historyIndexAtSave: number = 0;
	
	constructor(resource, options?: DocumentOptions) {
		super();
		
		this.resource = resource;
		this.string = resource.contents;
		
		this.setupResource();
		
		options = {
			noParse: false,
			...options,
		};
		
		this.noParse = options.noParse;
		this.modified = resource.newlinesNormalised;
		
		this.createLines();
		
		this.source = new Source(this);
		
		this.source.parse();
	}
	
	static fromString(string) {
		return new Document(Memory.plain(string));
	}
	
	static maxEditsToApplyIndividually = 2;
	
	get url() {
		return this.resource.url;
	}
	
	get format() {
		return this.resource.format;
	}
	
	get lang() {
		return this.format.lang;
	}
	
	get path() {
		return this.url.path;
	}
	
	get protocol() {
		return this.url.protocol;
	}
	
	get isSaved() {
		return ["file:"].includes(this.protocol);
	}
	
	get scopes() {
		return this.source.scopes;
	}
	
	getLines(string: string, prevLine?: LineIndex) {
		let lines = [];
		
		let {format} = this;
		let {newline} = format;
		let lineStrings = string.split(newline);
		let lineIndex = prevLine ? prevLine.lineIndex + 1 : 0;
		let startIndex = prevLine ? (prevLine.startIndex + prevLine.string.length + newline.length) : 0;
		
		for (let lineString of lineStrings) {
			lines.push(new Line(format, lineIndex, startIndex, lineString));
			
			lineIndex++;
			startIndex += lineString.length + newline.length;
		}
		
		return lines;
	}
	
	createLines(): void {
		this.lines = this.getLines(this.string);
	}
	
	updateLines(
		startLineIndex: number,
		invalidCount: number,
		newLines: Line[],
		lineIndexDiff: number,
		startIndexDiff: number,
	): void {
		this.lines.splice(startLineIndex, invalidCount, ...newLines);
		
		for (let i = startLineIndex + 1; i < this.lines.length; i++) {
			let line = this.lines[i];
			
			line.startIndex += startIndexDiff;
			line.lineIndex += lineIndexDiff;
		}
	}
	
	edit(selection: Selection, replaceWith: string): Edit {
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
		
		return new Edit(
			selection,
			currentStr,
			replaceWith,
			newSelection,
		);
	}
	
	lineEdit(lineIndex: number, removeLinesCount: number, insertLines: string[]): Edit {
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
	
	astEdit(astSelection: AstSelection, insertLines: string[]): Edit {
		let {startLineIndex, endLineIndex} = astSelection;
		
		return this.lineEdit(startLineIndex, endLineIndex - startLineIndex, insertLines);
	}
	
	/*
	apply edit but don't tell Source yet -- we may want to do a bunch of
	edits, in which case it's more efficient to wait until the end and
	tell Source to do a full re-parse.
	*/
	
	private _apply(edit: Edit): AppliedEdit {
		let {selection, string, replaceWith} = edit;
		let index = this.indexFromCursor(selection.left);
		
		this.string = this.string.substr(0, index) + replaceWith + this.string.substr(index + string.length);
		
		let startLineIndex = selection.start.lineIndex;
		let invalidCount = (selection.end.lineIndex - startLineIndex) + 1;
		let prefix = this.lines[startLineIndex].string.substr(0, selection.start.offset);
		let suffix = this.lines[selection.end.lineIndex].string.substr(selection.end.offset);
		let newLines = this.getLines(prefix + replaceWith + suffix, this.lines[startLineIndex - 1] || null);
		
		let startIndexDiff = replaceWith.length - string.length;
		let lineIndexDiff = newLines.length - invalidCount;
		
		this.updateLines(startLineIndex, invalidCount, newLines, lineIndexDiff, startIndexDiff);
		
		return {
			edit,
			index,
			lineDiff: {startLineIndex, invalidCount, newLines},
		};
	}
	
	private applyEdit(edit: Edit): void {
		let appliedEdit = this._apply(edit);
		
		this.source.edit(appliedEdit);
		
		this.modified = true;
		
		this.fire("edit", [appliedEdit]);
	}
	
	private applyEdits(edits: Edit[]): void {
		if (edits.length <= Document.maxEditsToApplyIndividually) {
			for (let edit of edits) {
				this.applyEdit(edit);
			}
		} else {
			let appliedEdits = edits.map(edit => this._apply(edit));
			
			this.source.parse();
			
			this.modified = true;
			
			this.fire("edit", appliedEdits);
		}
	}
	
	applyAndAddHistoryEntry(edits: Edit[]): HistoryEntry {
		this.applyEdits(edits);
		
		let entry = new HistoryEntry(edits);
		
		if (this.historyIndex < this.history.length) {
			this.history.splice(this.historyIndex);
		}
		
		this.history.push(entry);
		this.historyIndex = this.history.length;
		
		this.fire("historyEntryAdded", entry);
		
		return entry;
	}
	
	applyAndMergeWithLastHistoryEntry(edits: Edit[]): HistoryEntry {
		this.applyEdits(edits);
		
		let entry = this.history.at(-1);
		
		entry.merge(edits);
		
		return entry;
	}
	
	undo(): HistoryEntry | null {
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
	
	redo(): HistoryEntry | null {
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
		return AstSelection.linesToSelectionContents(this.getSelectedLines(astSelection));
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
	
	wordAtCursor(cursor: Cursor): WordAtCursor {
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
	
	setupResource(watch=false) {
		this.resourceTeardownFns = [
			this.resource.on("formatChanged", this.onResourceFormatChanged.bind(this)),
		];
		
		if (watch) {
			this.setupWatch();
		}
	}
	
	teardownResource() {
		if (this.teardownWatch) {
			this.teardownWatch();
			
			delete this.teardownWatch;
		}
		
		for (let fn of this.resourceTeardownFns) {
			fn();
		}
		
		this.resourceTeardownFns = [];
	}
	
	setResource(resource) {
		let watching = !!this.teardownWatch;
		
		this.teardownResource();
		
		this.resource = resource;
		
		this.source.parse();
		
		this.setupResource(watching);
		
		this.fire("resourceChanged");
	}
	
	onResourceFormatChanged() {
		this.source.parse();
	}
	
	private onSave() {
		this.modified = false;
		this.fileChangedWhileModified = false;
		this.historyIndexAtSave = this.historyIndex;
		
		platform.removeBackup(this);
		
		this.fire("save");
	}
	
	async save() {
		await this.resource.save(this.toString());
		
		this.onSave();
	}
	
	async saveAs(url: URL): Promise<void> {
		let file = await File.write(url, this.string);
		
		this.setResource(file);
		
		this.onSave();
	}
	
	setupWatch() {
		if (this.teardownWatch) {
			this.teardownWatch();
		}
		
		this.teardownWatch = this.resource.watch(this.onWatchEvent.bind(this));
	}
	
	private async onWatchEvent() {
		let {contents} = this.resource;
		
		if (contents === null || this.modified) {
			this.fileChangedWhileModified = true;
		} else {
			let edit = this.edit(this.selectAll(), contents);
			
			this.applyAndAddHistoryEntry([edit]);
			
			this.modified = false;
		}
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
		let document = new Document(Memory.plain(this.string), {
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
	
	generateNodesStartingOnLine(lineIndex, lang=null) {
		return this.source.generateNodesStartingOnLine(lineIndex, lang);
	}
	
	getNodesOnLine(lineIndex, lang=null) {
		return [...this.generateNodesStartingOnLine(lineIndex, lang)];
	}
	
	getNodeAtCursor(cursor) {
		return this.source.getNodeAtCursor(cursor);
	}
	
	toString() {
		return this.string;
	}
	
	teardown() {
		this.teardownResource();
	}
}
