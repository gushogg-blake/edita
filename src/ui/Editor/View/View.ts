import {Evented, mapArrayToObject} from "utils";
import {Selection, s, Cursor, c, AstSelection, a} from "core";
import type {Document} from "core";
import type {AppliedEdit} from "core/Document";

import {
	selectionUtils as astSelectionUtils,
	getPickOptions,
	getDropTargets,
	getFooterLineIndex,
	type PickOption,
	type DropTarget,
} from "modules/astIntel";

import type {EditorMode, ActiveCompletions} from "ui/Editor";

import SelectionUtils from "./utils/Selection";
import AstSelectionUtils from "./utils/AstSelection";
import wrapLine, {type WrappedLine} from "./utils/wrapLine";
import canvasUtils from "./utils/canvasUtils";
import Renderer from "./render/Renderer";
import ViewLine from "./ViewLine";

type SetNormalSelectionOptions = {
	updateAstSelection: boolean;
};

type ViewLineDiff = {
	startLineIndex: number;
	invalidCount: number;
	newViewLines: ViewLine[];
};

export default class View extends Evented<{
	modeSwitch: void;
	updatePickOptions: void;
	updateDropTargets: void;
	scroll: void;
	wrapChange: void;
	updateCompletions: void;
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
	wrappedLines: WrappedLine[];
	
	focused: boolean = false;
	visible: boolean = false;
	mounted: boolean = false;
	
	document: Document;
	normalSelection: NormalSelection = s(c(0, 0));
	astSelection: AstSelection | null = null;
	
	normalHilites: Selection[] = [];
	
	mode: EditorMode = "normal";
	
	Selection: typeof SelectionUtils;
	AstSelection: typeof AstSelectionUtils;
	
	// TODO simplify
	[K in keyof typeof CanvasUtils]: (typeof CanvasUtils)[K];
	
	// for remembering the "intended" col when moving a cursor up/down to a line
	// that doesn't have as many cols as the cursor
	selectionEndCol: number = 0;
	
	private pickOptions: PickOption[] = [];
	private dropTargets: DropTarget[] = [];
	
	private insertCursor: Cursor | null = null;
	private astSelectionHilite: AstSelection | null = null;
	private astInsertionHilite: AstSelection | null = null; // TODO not 100% sure what this is
	
	private completions: ActiveCompletions | null = null;
	
	// TYPE not clear what this is but it's a map of header line index to footer line index
	// might be better as a map, and possibly with explicit types for the numbers -- not
	// sure about that yet as a pattern, but would obvs extend to line numbers, offsets, etc
	// might be worth doing, as there is always gonna be ambiguity -- would allow us to
	// distinguish between line indexes and line positions (where a position can be
	// array.length, whereas an index can't)
	private folds: Record<string, number> = {};
	
	private redrawTimer: number | null = null;
	private redrawnWhileHidden: boolean = false;
	private hasBatchedUpdates: boolean = false;
	private syncRedrawBatchDepth: number = 0;
	
	private cursorBlinkOn: boolean = false;
	private cursorInterval: number | null = null;
	
	private topMargin: number = 2;
	
	constructor(document: Document) {
		super();
		
		this.Selection = bindFunctions(this, SelectionUtils);
		this.AstSelection = bindFunctions(this, AstSelectionUtils);
		
		Object.assign(this, canvasUtils);
		
		this.document = document;
		
		this.updateAstSelectionFromNormalSelection();
		
		this.marginStyle = {
			margin: 2,
			paddingLeft: 3,
			paddingRight: 7,
		};
		
		this.measurements = {
			rowHeight: 20,
			colWidth: 8,
		};
		
		this.scrollPosition = {
			x: 0,
			y: 0,
		};
		
		this.updateSizes(800, 600);
		
		this.wrap = base.getPref("wrap");
		
		this.createViewLines();
		
		this.blur = this.blur.bind(this);
		
		this.teardownCallbacks = [
			document.on("edit", this.onDocumentEdit.bind(this)),
		];
	}
	
	onDocumentEdit(appliedEdits) {
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
				this.wrap,
				viewLine,
				this.folds[lineIndex],
				this.document.format.indentation,
				this.measurements,
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
	
	render(canvasRenderers: CanvasRenderers, uiState): void {
		let renderer = new Renderer(this, canvasRenderers, uiState);
		
		renderer.render();
	}
	
	switchToAstMode(): void {
		this.mode = "ast";
		
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
	
	showPickOptionsFor(lineIndex) {
		let {document} = this;
		let {astMode} = document.langFromAstSelection(a(lineIndex));
		
		this.pickOptions = [{
			lineIndex,
			
			options: getPickOptions(astMode, document, lineIndex).map(function(option) {
				return {
					lineIndex,
					option,
				};
			}),
		}];
		
		this.fire("updatePickOptions");
	}
	
	clearPickOptions() {
		this.pickOptions = [];
		
		this.fire("updatePickOptions");
	}
	
	showDropTargets() {
		let byLineIndex = new Map();
		
		let {
			document,
			wrappedLines,
			astSelection,
			astSelectionHilite,
			measurements: {
				rowHeight,
			},
			sizes: {
				height,
			},
		} = this;
		
		let {lineIndex} = this.findFirstVisibleLine();
		
		let rowsToRender = height / rowHeight;
		let rowsRenderedOrSkipped = 0;
		
		while (lineIndex < wrappedLines.length) {
			let wrappedLine = wrappedLines[lineIndex];
			let {line} = wrappedLine;
			
			if (
				astSelection.containsLineIndex(lineIndex)
				|| astSelectionHilite?.containsLineIndex(lineIndex)
			) {
				lineIndex++;
				
				continue;
			}
			
			let {astMode} = document.langFromLineIndex(lineIndex);
			
			if (!astMode) {
				lineIndex++;
				rowsRenderedOrSkipped += wrappedLine.height;
				
				continue;
			}
			
			byLineIndex.set(lineIndex, getDropTargets(
				astMode,
				document,
				lineIndex,
			).map(function(target) {
				return {
					lineIndex,
					target,
				};
			}));
			
			rowsRenderedOrSkipped += wrappedLine.height;
			
			if (rowsRenderedOrSkipped >= rowsToRender) {
				break;
			}
			
			lineIndex++;
		}
		
		this.dropTargets = [...byLineIndex.entries()].map(function([lineIndex, targets]) {
			return {
				lineIndex,
				targets,
			};
		});
		
		this.fire("updateDropTargets");
	}
	
	clearDropTargets() {
		this.dropTargets = [];
		
		this.fire("updateDropTargets");
	}
	
	getScrollHeight() {
		let {
			measurements: {rowHeight},
			sizes: {topMargin, height},
		} = this;
		
		let rows = this.countLineRowsFolded();
		
		return rows === 1 ? height : topMargin + (rows - 1) * rowHeight + height;
	}
	
	getScrollWidth() {
		let {
			document,
			measurements: {colWidth},
			sizes: {codeWidth: width},
		} = this;
		
		let longestLineWidth = document.getLongestLineWidth();
		
		return longestLineWidth * colWidth + width;
	}
	
	getVerticalScrollMax() {
		return this.getScrollHeight() - this.sizes.height;
	}
	
	getHorizontalScrollMax() {
		return this.wrap ? 0 : this.getScrollWidth() - this.sizes.codeWidth;
	}
	
	boundedScrollY(y) {
		return Math.max(0, Math.min(y, this.getVerticalScrollMax()));
	}
	
	boundedScrollX(x) {
		return Math.max(0, Math.min(x, this.getHorizontalScrollMax()));
	}
	
	ensureScrollIsWithinBounds() {
		let x = this.boundedScrollX(this.scrollPosition.x);
		let y = this.boundedScrollY(this.scrollPosition.y);
		
		if (x !== this.scrollPosition.x || y !== this.scrollPosition.y) {
			this.setScrollPositionNoValidate({x, y});
		}
	}
	
	scrollBy(x, y) {
		let scrolled = false;
		
		if (x !== 0 && !this.wrap) {
			let newX = Math.round(this.boundedScrollX(this.scrollPosition.x + x));
			
			scrolled = newX !== this.scrollPosition.x;
			
			this.scrollPosition.x = newX;
		}
		
		if (y !== 0) {
			let newY = this.boundedScrollY(this.scrollPosition.y + y);
			
			scrolled = newY !== this.scrollPosition.y;
			
			this.scrollPosition.y = newY;
		}
		
		if (scrolled) {
			this.fire("scroll");
			
			this.scheduleRedraw();
		}
		
		return scrolled;
	}
	
	scrollTo(x, y) {
		this.setScrollPosition({x, y});
	}
	
	setVerticalScrollPosition(position) {
		this.setVerticalScrollNoValidate(Math.round(this.getVerticalScrollMax() * position));
	}
	
	setHorizontalScrollPosition(position) {
		this.setHorizontalScrollNoValidate(Math.round(this.getHorizontalScrollMax() * position));
	}
	
	setVerticalScrollNoValidate(y) {
		this.scrollPosition.y = y;
		
		this.fire("scroll");
		
		this.scheduleRedraw();
	}
	
	setHorizontalScrollNoValidate(x) {
		if (this.wrap && x !== 0) {
			return;
		}
		
		this.scrollPosition.x = x;
		
		this.fire("scroll");
		
		this.scheduleRedraw();
	}
	
	setScrollPosition(scrollPosition) {
		let {x, y} = scrollPosition;
		
		this.scrollPosition = {
			x: this.boundedScrollX(x),
			y: this.boundedScrollY(y),
		};
		
		this.updateScrollbars();
		
		this.fire("scroll");
	}
	
	setScrollPositionNoValidate(scrollPosition) {
		this.scrollPosition = {...scrollPosition};
		
		this.updateScrollbars();
		
		this.fire("scroll");
	}
	
	/*
	ensure scroll position is still valid after e.g. resizing, which
	can change the height if wrapping is enabled
	*/
	
	validateScrollPosition() {
		this.setScrollPosition(this.scrollPosition);
	}
	
	scrollPage(dir) {
		let {rows} = this.sizes;
		
		this.scrollBy(0, rows * dir);
	}
	
	scrollPageDown() {
		this.scrollPage(1);
	}
	
	scrollPageUp() {
		this.scrollPage(-1);
	}
	
	ensureSelectionIsOnScreen() {
		if (this.mode === "ast") {
			this.ensureAstSelectionIsOnScreen();
		} else {
			this.ensureNormalCursorIsOnScreen();
		}
	}
	
	ensureAstSelectionIsOnScreen() {
		let {height} = this.sizes;
		let {startLineIndex, endLineIndex} = this.astSelection;
		
		let topY = this.screenYFromLineIndex(startLineIndex);
		let bottomY = this.screenYFromLineIndex(endLineIndex);
		let selectionHeight = bottomY - topY;
		let bottomDistance = height - bottomY;
		
		let idealBuffer = this.measurements.rowHeight * 5;
		let spaceAvailable = height - selectionHeight;
		
		if (spaceAvailable >= idealBuffer * 2) {
			let topBuffer = Math.max(idealBuffer, topY);
			let topDiff = topBuffer - topY;
			let newBottomDistance = bottomDistance + topDiff;
			let idealBottomBuffer = Math.max(idealBuffer, newBottomDistance);
			
			let bottomDiff = idealBottomBuffer - newBottomDistance;
			
			this.scrollBy(0, -topDiff + bottomDiff);
		} else {
			let topBuffer = Math.max(0, spaceAvailable / 2);
			let topDiff = topBuffer - topY;
			
			this.scrollBy(0, -topDiff);
		}
	}
	
	ensureNormalCursorIsOnScreen() {
		let {
			scrollPosition,
			measurements,
		} = this;
		
		let {codeWidth: width, rows} = this.sizes;
		let {colWidth, rowHeight} = measurements;
		
		let {end} = this.normalSelection;
		let {lineIndex, offset} = end;
		let [row, col] = this.rowColFromCursor(end);
		
		let maxRow = this.countLineRowsFolded() - 1;
		let firstVisibleRow = Math.floor(scrollPosition.y / rowHeight);
		let firstFullyVisibleRow = Math.ceil(scrollPosition.y / rowHeight);
		let lastFullyVisibleRow = firstVisibleRow + rows;
		
		let idealRowBufferTop = rows > 10 ? 5 : 0;
		let idealRowBufferBottom = rows > 10 ? 5 : 1;
		
		let topRowDiff = idealRowBufferTop - (row - firstFullyVisibleRow);
		
		if (topRowDiff > 0) {
			scrollPosition.y = Math.max(0, scrollPosition.y - topRowDiff * rowHeight);
		}
		
		let bottomRowDiff = idealRowBufferBottom - (lastFullyVisibleRow - row);
		
		if (bottomRowDiff > 0) {
			scrollPosition.y = Math.min(scrollPosition.y + bottomRowDiff * rowHeight, maxRow * rowHeight);
		}
		
		if (!this.wrap) {
			let colBuffer = colWidth * 4;
			
			let [x] = this.screenCoordsFromRowCol(row, col);
			
			x -= this.sizes.marginOffset;
			
			if (x < 1) {
				scrollPosition.x = Math.max(0, x - colBuffer);
			}
			
			if (x > this.sizes.codeWidth - colBuffer) {
				scrollPosition.x += x - this.sizes.codeWidth + colBuffer;
			}
		}
		
		this.fire("scroll");
	}
	
	setNormalSelection(selection, options?: SetNormalSelectionOptions) {
		options = {
			updateAstSelection: true,
			...options,
		};
		
		this.normalSelection = this.Selection.validate(selection);
		
		// TODO validate for folds
		
		if (options.updateAstSelection) {
			this.updateAstSelectionFromNormalSelection();
		}
		
		this.scheduleRedraw();
	}
	
	validateSelection() {
		if (this.mode === "normal") {
			this.setNormalSelection(this.normalSelection);
		} else {
			this.setAstSelection(this.astSelection);
		}
	}
	
	setInsertCursor(cursor) {
		this.insertCursor = cursor;
		
		this.scheduleRedraw();
	}
	
	setAstSelection(astSelection) {
		this.astSelection = astSelectionUtils.trim(this.document, this.AstSelection.validate(astSelection));
		this.astSelectionHilite = null;
		
		// TODO validate for folds
		
		this.updateNormalSelectionFromAstSelection();
		
		this.scheduleRedraw();
	}
	
	setAstSelectionHilite(astSelection) {
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
		let [, endCol] = this.rowColFromCursor(this.normalSelection.end);
		
		this.selectionEndCol = endCol;
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
	
	setFolds(folds): void {
		this.folds = folds;
		
		// TODO validate selection
		
		this.scheduleRedraw();
	}
	
	toggleFoldHeader(lineIndex: number): void {
		let {document} = this;
		let footerLineIndex = getFooterLineIndex(document, lineIndex);
		
		if (lineIndex in this.folds) {
			delete this.folds[lineIndex];
			
			return;
		}
		
		if (footerLineIndex === null) {
			return;
		}
		
		this.folds[lineIndex] = footerLineIndex + 1;
		
		this.scheduleRedraw();
	}
	
	adjustFoldsForEdit(edit: Edit): void {
		let {selection, newSelection} = edit;
		let origEndLineIndex = selection.end.lineIndex;
		let newEndLineIndex = newSelection.end.lineIndex;
		let diff = newEndLineIndex - origEndLineIndex;
		
		this.folds = mapArrayToObject(Object.entries(this.folds), function([lineIndex, foldTo]) {
			lineIndex = Number(lineIndex);
			
			if (lineIndex > origEndLineIndex) {
				lineIndex += diff;
				foldTo += diff;
			}
			
			return [lineIndex, foldTo];
		});
	}
	
	setNormalHilites(hilites: Selection[]) {
		this.normalHilites = hilites;
		
		this.scheduleRedraw();
	}
	
	setWrap(wrap: boolean): void {
		if (this.wrap === wrap) {
			return;
		}
		
		this.wrap = wrap;
		
		if (this.wrap) {
			this.setHorizontalScrollNoValidate(0);
		}
		
		this.createWrappedLines();
		
		this.fire("wrapChanged", wrap);
		
		this.scheduleRedraw();
	}
	
	setCompletions(completions: ActiveCompletions): void {
		this.completions = completions;
		
		this.fire("updateCompletions");
	}
	
	setMeasurements(measurements) {
		this.measurements = measurements;
		
		this.fire("updateMeasurements");
		
		this.updateSizes();
	}
	
	setCanvasSize(width, height) {
		this.updateSizes(width, height);
		this.createWrappedLines();
		this.validateScrollPosition();
	}
	
	updateSizes(width=null, height=null) {
		if (width === null && height === null) {
			({width, height} = this.sizes);
		}
		
		let {
			lines,
			topMargin,
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
			topMargin,
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
	
	startCursorBlink() {
		if (!this.visible) {
			return;
		}
		
		if (this.mode !== "normal") {
			return;
		}
		
		if (this.cursorInterval) {
			clearInterval(this.cursorInterval);
		}
		
		this.cursorBlinkOn = true;
		
		this.cursorInterval = setInterval(() => {
			this.cursorBlinkOn = !this.cursorBlinkOn;
			
			this.updateCanvas();
		}, base.prefs.cursorBlinkPeriod);
		
		this.scheduleRedraw();
	}
	
	clearCursorBlink() {
		if (this.cursorInterval) {
			clearInterval(this.cursorInterval);
		}
		
		this.cursorInterval = null;
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
