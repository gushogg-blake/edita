import {Evented, mapArrayToObject, bindFunctions} from "utils";
import {Selection, s, Cursor, c, AstSelection, a} from "core";
import type {Document, Line} from "core";
import type {Edit, AppliedEdit, LineDiff} from "core/document";

import {astSelectionUtils, getFooterLineIndex} from "modules/astIntel";

import type {EditorMode} from "ui/editor";

import type {
	Canvas,
	UiState,
	Measurements,
	Sizes,
	MarginStyle,
	ScrollPosition,
	Folds,
	ActiveCompletions,
} from "ui/editor/view";


import wrapLine, {type WrappedLine} from "./utils/wrapLine";
import CanvasUtils from "./utils/CanvasUtils";
import Renderer from "./render/Renderer";
import Scroll from "./Scroll";
import ViewLine from "./ViewLine";
import AstMode from "./AstMode";

type ViewLineDiff = {
	startLineIndex: number;
	invalidCount: number;
	newViewLines: ViewLine[];
};

const TOP_MARGIN = 2;

export default class View extends Evented<{
	/*
	a lot of these events don't have an arg, because they basically
	mean "something changed, re-render everything"
	*/
	
	modeSwitch: void;
	scroll: void;
	wrapChanged: boolean;
	updateCompletions: void; // TODO maybe best to just listen to these from the source
	updateMeasurements: void;
	updateSizes: void;
	updateScrollbars: void;
	updateCanvas: void;
	requestFocus: void;
	requestResize: void;
	requestResizeAsync: void;
	focus: void;
	blur: void;
	show: void;
	hide: void;
}> {
	viewLines: ViewLine[];
	
	focused: boolean = false;
	visible: boolean = false;
	mounted: boolean = false;
	
	document: Document;
	
	mode: EditorMode = "normal";
	
	scroll = new Scroll(this);
	normalSelection = new NormalSelection(this);
	astSelection = new AstSelectionHelper(this);
	wrapping = new Wrapping(this);
	folds = new Folds(this);
	completions = new Completions(this);
	astMode = new AstMode(this);
	canvasUtils = new CanvasUtils(this);
	
	insertCursor: Cursor | null = null;
	
	normalHilites: Selection[] = [];
	
	marginStyle: MarginStyle = {
		margin: 2,
		paddingLeft: 3,
		paddingRight: 7,
	};
	
	measurements: Measurements = {
		rowHeight: 20,
		colWidth: 8,
	};
	
	sizes: Sizes;
	
	private needToUpdateAstSelection: boolean = false;
	
	private redrawTimer: ReturnType<typeof setTimeout> | null = null;
	private redrawnWhileHidden: boolean = false;
	private hasBatchedUpdates: boolean = false;
	private syncRedrawBatchDepth: number = 0;
	
	private requestFocusOnMount: boolean;
	
	private teardownCallbacks: Array<() => void>;
	
	constructor(document: Document) {
		super();
		
		this.document = document;
		
		this.updateAstSelectionFromNormalSelection();
		
		this.updateSizes(800, 600);
		
		this.wrap = base.getPref("wrap");
		
		this.createViewLines();
		
		this.blur = this.blur.bind(this);
		
		this.teardownCallbacks = [
			document.on("edit", this.onDocumentEdit.bind(this)),
			this.scroll.on("scroll", () => this.onScroll()),
			this.scroll.on("updateScrollbars", () => this.updateScrollbars()),
		];
	}
	
	onDocumentEdit(appliedEdits: AppliedEdit[]): void {
		for (let {lineDiff} of appliedEdits) {
			this.updateViewLines(lineDiff);
		}
		
		//this.validateSelection();
		
		this.ensureScrollIsWithinBounds();
		
		this.updateMarginSize();
		
		this.adjustHilitesAndFolds(appliedEdits);
		
		this.scheduleRedraw();
	}
	
	/*
	there are 3 levels to lines - lines on the Document, which don't have
	much rendering-related info; viewLines, which calculate tab widths;
	and wrappedLines, which have soft wrap info.
	*/
	
	get lines() {
		return this.document.lines;
	}
	
	getViewLines(lines: Line[]): ViewLine[] {
		return lines.map((line) => {
			return new ViewLine(line, this.document.format);
		});
	}
	
	createViewLines(): void {
		this.viewLines = this.getViewLines(this.lines);
		
		this.createWrappedLines();
	}
	
	updateViewLines(lineDiff: LineDiff): void {
		let {startLineIndex, invalidCount, newLines} = lineDiff;
		
		let newViewLines = this.getViewLines(newLines);
		
		this.viewLines.splice(startLineIndex, invalidCount, ...newViewLines);
		
		this.updateWrappedLines({startLineIndex, invalidCount, newViewLines});
	}
	
	getWrappedLines(viewLines: ViewLine[]): WrappedLine[] {
		return viewLines.map((viewLine, lineIndex) => {
			return wrapLine(
				this,
				viewLine,
				this.sizes.codeWidth,
			);
		});
	}
	
	createWrappedLines(): void {
		this.wrappedLines = this.getWrappedLines(this.viewLines);
		
		this.scheduleRedraw();
	}
	
	updateWrappedLines(viewLineDiff: ViewLineDiff): void {
		let {startLineIndex, invalidCount, newViewLines} = viewLineDiff;
		
		let newWrappedLines = this.getWrappedLines(newViewLines);
		
		this.wrappedLines.splice(startLineIndex, invalidCount, ...newWrappedLines);
		
		this.scheduleRedraw();
	}
	
	render(canvas: Canvas, uiState: UiState): void {
		let renderer = new Renderer(this, canvas, uiState);
		
		renderer.render();
	}
	
	switchToAstMode(): void {
		this.mode = "ast";
		
		this.updateAstSelection();
		this.clearCursorBlink();
		this.scheduleRedraw();
		
		this.fire("modeSwitch");
	}
	
	switchToNormalMode() {
		this.mode = "normal";
		this.astSelectionHilite = null;
		
		this.startCursorBlink();
		this.scheduleRedraw();
		
		this.fire("modeSwitch");
	}
	
	get lang() {
		if (this.mode === "ast") {
			return this.document.langFromAstSelection(this.astSelection);
		} else {
			let startLang = this.document.langFromCursor(this.normalSelection.start);
			let endLang = this.document.langFromCursor(this.normalSelection.end);
			
			if (startLang === endLang) {
				return startLang;
			} else {
				return this.document.lang;
			}
		}
	}
	
	setNormalSelection(selection: Selection) {
		this.normalSelections.setNormalSelection(selection);
		
		this.needToUpdateAstSelection = true;
		
		this.scheduleRedraw();
	}
	
	updateAstSelection() {
		if (this.needToUpdateAstSelection) {
			this.updateAstSelectionFromNormalSelection();
			
			this.needToUpdateAstSelection = false;
		}
	}
	
	validateSelection() {
		if (this.mode === "normal") {
			this.setNormalSelection(this.normalSelection);
		} else {
			this.setAstSelection(this.astSelection);
		}
	}
	
	setInsertCursor(cursor: Cursor) {
		this.insertCursor = cursor;
		
		this.scheduleRedraw();
	}
	
	setAstSelection(astSelection: AstSelection) {
		this.astSelection = astSelectionUtils.trim(this.document, this.AstSelection.validate(astSelection));
		this.astSelectionHilite = null;
		
		// TODO validate for folds
		
		this.updateNormalSelectionFromAstSelection();
		
		this.scheduleRedraw();
	}
	
	setAstSelectionHilite(astSelection: AstSelection) {
		this.astSelectionHilite = astSelection;
		
		this.scheduleRedraw();
	}
	
	clearAstSelectionHilite() {
		this.astSelectionHilite = null;
		
		this.scheduleRedraw();
	}
	
	setAstInsertionHilite(astSelection) {
		this.astInsertionHilite = astSelection;
		
		this.scheduleRedraw();
	}
	
	updateSelectionEndCol() {
		let {col} = this.canvasUtils.rowColFromCursor(this.normalSelection.end);
		
		this.selectionEndCol = col;
	}
	
	updateNormalSelectionFromAstSelection() {
		this.normalSelection = this.Selection.endOfLineContent(Math.max(0, this.astSelection.endLineIndex - 1));
		
		this.updateSelectionEndCol();
		
		this.scheduleRedraw();
	}
	
	updateAstSelectionFromNormalSelection() {
		let {document} = this;
		let {left, right} = this.normalSelection;
		let {astMode} = this.lang;
		
		this.astSelection = astSelectionUtils.fromLineRange(document, left.lineIndex, right.lineIndex + 1);
		
		this.scheduleRedraw();
	}
	
	getNormalSelectionForFind() {
		return this.mode === "ast" ? this.Selection.fromAstSelection(this.normalSelection) : this.normalSelection.sort();
	}
	
	adjustHilitesAndFolds(appliedEdits: AppliedEdit[]): void {
		for (let {edit} of appliedEdits) {
			this.adjustHilitesForEdit(edit);
			this.adjustFoldsForEdit(edit);
		}
	}
	
	adjustHilitesForEdit(edit: Edit): void {
		this.setNormalHilites(this.normalHilites.map(function(hilite) {
			if (hilite.overlaps(edit.selection)) {
				return null;
			}
			
			return hilite.edit(edit);
		}).filter(Boolean));
	}
	
	setNormalHilites(hilites: Selection[]) {
		this.normalHilites = hilites;
		
		this.scheduleRedraw();
	}
	
	onScroll() {
		this.scheduleRedraw();
		
		this.fire("scroll");
	}
	
	setMeasurements(measurements: Measurements) {
		this.measurements = measurements;
		
		this.fire("updateMeasurements");
		
		this.updateSizes();
	}
	
	setCanvasSize(width: number, height: number) {
		this.updateSizes(width, height);
		this.createWrappedLines();
		this.scroll.validateScrollPosition();
	}
	
	updateSizes(width: number | null = null, height: number | null = null) {
		if (width === null && height === null) {
			({width, height} = this.sizes);
		}
		
		let {
			lines,
			marginStyle,
			measurements,
		} = this;
		
		let {
			colWidth,
			rowHeight,
		} = measurements;
		
		let marginWidth = Math.round(marginStyle.paddingLeft + String(lines.length).length * measurements.colWidth + marginStyle.paddingRight);
		let marginOffset = marginWidth + marginStyle.margin;
		let codeWidth = width - marginOffset;
		
		this.sizes = {
			width,
			height,
			topMargin: TOP_MARGIN,
			marginWidth,
			marginOffset,
			marginStyle,
			codeWidth: width - marginOffset,
			rows: Math.floor(height / rowHeight),
			cols: Math.floor(codeWidth / colWidth),
		};
		
		this.fire("updateSizes");
		
		this.scheduleRedraw();
	}
	
	updateMarginSize() {
		let {marginWidth} = this.sizes;
		
		this.updateSizes();
		
		if (marginWidth !== this.sizes.marginWidth) {
			this.createWrappedLines();
		}
	}
	
	updateCanvas() {
		this.fire("updateCanvas");
	}
	
	updateScrollbars() {
		this.fire("updateScrollbars");
	}
	
	/*
	redraws can be either batched synchronous or scheduled
	
	batched synchronous are sync, which helps with avoiding a flash
	of blank canvas when re-initialising the canvases on resize (see
	Editor component)
	
	scheduled are async (setTimeout with 0) and are simpler, as you
	don't have to start and end a batch whenever you want to do stuff
	*/
	
	startSyncRedrawBatch() {
		this.syncRedrawBatchDepth++;
	}
	
	endSyncRedrawBatch() {
		if (this.syncRedrawBatchDepth === 0) {
			throw new Error("mismatched batched redraw calls");
		}
		
		this.syncRedrawBatchDepth--;
		
		if (this.syncRedrawBatchDepth === 0) {
			if (this.hasBatchedUpdates) {
				this.redrawSync();
			}
			
			this.hasBatchedUpdates = false;
		}
	}
	
	batchRedraw() {
		if (this.inSyncRedrawBatch) {
			this.hasBatchedUpdates = true;
		} else {
			this.redrawSync();
		}
	}
	
	get inSyncRedrawBatch() {
		return this.syncRedrawBatchDepth !== 0;
	}
	
	redrawSync() {
		if (this.visible) {
			this.updateCanvas();
			this.updateScrollbars();
		} else {
			this.redrawnWhileHidden = true;
		}
	}
	
	scheduleRedraw() {
		if (this.inSyncRedrawBatch) {
			this.hasBatchedUpdates = true;
			
			return;
		}
		
		if (this.redrawTimer !== null) {
			return;
		}
		
		this.redrawTimer = setTimeout(() => {
			this.redrawSync();
			
			this.redrawTimer = null;
		}, 0);
	}
	
	show() {
		this.visible = true;
		
		if (this.redrawnWhileHidden) {
			this.batchRedraw();
		}
		
		this.fire("show");
		
		this.startCursorBlink();
	}
	
	hide() {
		this.visible = false;
		
		this.clearCursorBlink();
		
		this.fire("hide");
	}
	
	focus() {
		this.focused = true;
		
		this.startCursorBlink();
		
		this.scheduleRedraw();
		
		this.fire("focus");
	}
	
	blur() {
		this.focused = false;
		
		this.clearCursorBlink();
		
		this.scheduleRedraw();
		
		this.fire("blur");
	}
	
	requestFocus() {
		if (this.mounted) {
			this.fire("requestFocus");
		} else {
			this.requestFocusOnMount = true;
		}
	}
	
	requestResizeAsync() {
		this.fire("requestResizeAsync");
	}
	
	uiMounted() {
		this.mounted = true;
		
		if (this.requestFocusOnMount) {
			this.requestFocus();
		}
	}
	
	teardown() {
		this.clearCursorBlink();
	}
}
