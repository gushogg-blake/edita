import {Evented} from "utils";
import type {View, ScrollPosition} from "ui/editor/view";

export type ScrollPosition = {
	x: number;
	y: number;
};

export class Scroll extends Evented<{
	scroll: void;
	updateScrollbars: void;
}> {
	scrollPosition: ScrollPosition = {x: 0, y: 0};
	
	private view: View;
	
	constructor(view: View) {
		this.view = view;
	}
	
	getScrollHeight() {
		let {
			measurements: {rowHeight},
			sizes: {topMargin, height},
		} = this.view;
		
		let rows = this.view.canvasUtils.countLineRowsFolded();
		
		return rows === 1 ? height : topMargin + (rows - 1) * rowHeight + height;
	}
	
	getScrollWidth() {
		let {
			document,
			measurements: {colWidth},
			sizes: {codeWidth: width},
		} = this.view;
		
		let longestLineWidth = document.getLongestLineWidth();
		
		return longestLineWidth * colWidth + width;
	}
	
	getVerticalScrollMax() {
		return this.getScrollHeight() - this.view.sizes.height;
	}
	
	getHorizontalScrollMax() {
		return this.view.wrap ? 0 : this.getScrollWidth() - this.view.sizes.codeWidth;
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
		
		if (x !== 0 && !this.view.wrap) {
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
		}
		
		return scrolled;
	}
	
	scrollTo(x, y) {
		this.setScrollPosition({x, y});
	}
	
	setVerticalScrollPosition(position: number) {
		this.setVerticalScrollNoValidate(Math.round(this.getVerticalScrollMax() * position));
	}
	
	setHorizontalScrollPosition(position: number) {
		this.setHorizontalScrollNoValidate(Math.round(this.getHorizontalScrollMax() * position));
	}
	
	setVerticalScrollNoValidate(y: number) {
		this.scrollPosition.y = y;
		
		this.fire("scroll");
	}
	
	setHorizontalScrollNoValidate(x: number) {
		if (this.wrap && x !== 0) {
			return;
		}
		
		this.scrollPosition.x = x;
		
		this.fire("scroll");
	}
	
	setScrollPosition(scrollPosition: ScrollPosition) {
		let {x, y} = scrollPosition;
		
		this.scrollPosition = {
			x: this.boundedScrollX(x),
			y: this.boundedScrollY(y),
		};
		
		this.fire("updateScrollbars");
		this.fire("scroll");
	}
	
	setScrollPositionNoValidate(scrollPosition) {
		this.scrollPosition = {...scrollPosition};
		
		this.fire("updateScrollbars");
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
		let {rows} = this.view.sizes;
		
		this.scrollBy(0, rows * dir);
	}
	
	scrollPageDown() {
		this.scrollPage(1);
	}
	
	scrollPageUp() {
		this.scrollPage(-1);
	}
	
	ensureSelectionIsOnScreen() {
		if (this.view.mode === "ast") {
			this.ensureAstSelectionIsOnScreen();
		} else {
			this.ensureNormalCursorIsOnScreen();
		}
	}
	
	ensureAstSelectionIsOnScreen() {
		let {view, scrollPosition} = this;
		let {measurements, astSelection} = view;
		let {rowHeight} = measurements;
		let {height} = view.sizes;
		let {startLineIndex, endLineIndex} = astSelection;
		
		let topY = view.canvasUtils.screenYFromLineIndex(startLineIndex);
		let bottomY = view.canvasUtils.screenYFromLineIndex(endLineIndex);
		let selectionHeight = bottomY - topY;
		let bottomDistance = height - bottomY;
		
		let idealBuffer = rowHeight * 5;
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
		let {view, scrollPosition} = this;
		let {measurements, normalSelection} = view;
		let {codeWidth, rows, marginOffset} = view.sizes;
		let {colWidth, rowHeight} = measurements;
		
		let {end} = normalSelection;
		let {lineIndex, offset} = end;
		let {row, col} = view.canvasUtils.rowColFromCursor(end);
		
		let maxRow = view.canvasUtils.countLineRowsFolded() - 1;
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
		
		if (!view.wrap) {
			let colBuffer = colWidth * 4;
			
			let {x} = view.canvasUtils.screenCoordsFromRowCol({row, col});
			
			x -= marginOffset;
			
			if (x < 1) {
				scrollPosition.x = Math.max(0, x - colBuffer);
			}
			
			if (x > codeWidth - colBuffer) {
				scrollPosition.x += x - codeWidth + colBuffer;
			}
		}
		
		this.fire("scroll");
	}
}
