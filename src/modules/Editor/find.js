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
			
			let {view} = editor;
			
			view.startBatch();
			
			view.setNormalHilites(session.all.map(result => result.selection));
			
			this.next();
			
			view.endBatch();
		},
		
		next() {
			let {
				loopedFile,
				result,
			} = session.next() || {};
			
			if (!result) {
				return null;
			}
			
			let {view} = editor;
			
			view.startBatch();
			
			view.setNormalSelection(result.selection);
			view.ensureNormalCursorIsOnScreen();
			
			view.endBatch();
			
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
			
			let {view} = editor;
			
			view.startBatch();
			
			view.normalSelection = result.selection;
			view.ensureNormalCursorIsOnScreen();
			
			view.endBatch();
			
			return {
				loopedFile,
			};
		},
		
		clearHilites() {
			editor.view.setNormalHilites([]);
		},
		
		reset() {
			session = null;
		},
	};
}
