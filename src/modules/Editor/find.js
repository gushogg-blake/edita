let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let FindSession = require("./FindSession");

let {s} = Selection;
let {c} = Cursor;

module.exports = function(editor) {
	let session = null;
	
	return {
		createSession() {
			let {document, view} = editor;
			let cursor;
			
			if (view.mode === "normal") {
				cursor = view.normalSelection.start;
			} else {
				cursor = c(view.astSelection.startLineIndex, 0);
			}
			
			return new FindSession(document, cursor);
		},
		
		find(search, type, caseMode) {
			if (!session) {
				session = this.createSession();
			}
			
			session.find(search, type, caseMode);
			
			editor.view.normalHilites = session.all.map(result => result.selection);
			
			this.next();
		},
		
		next() {
			let {
				loopedFile,
				result,
			} = session.next() || {};
			
			if (!result) {
				return null;
			}
			
			editor.view.normalSelection = result.selection;
			editor.view.ensureNormalCursorIsOnScreen();
			editor.view.redraw();
			
			return {
				loopedFile,
			};
		},
		
		previous() {
			let {
				loopedFile,
				result,
			} = session.previous() || {};
			
			if (!result) {
				return null;
			}
			
			editor.view.normalSelection = result.selection;
			editor.view.ensureNormalCursorIsOnScreen();
			editor.view.redraw();
			
			return {
				loopedFile,
			};
		},
		
		clearHilites() {
			editor.view.normalHilites = [];
			editor.view.redraw();
		},
		
		reset() {
			session = null;
		},
	};
}
