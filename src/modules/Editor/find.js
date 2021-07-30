let FindSession = require("./FindSession");

module.exports = function(editor) {
	let session = null;
	
	return {
		createSession() {
			let {document, view} = editor;
			let cursor;
			
			if (view.mode === "normal") {
				cursor = view.normalSelection.end;
			} else {
				let [startLineIndex] = view.astSelection;
				
				cursor = [startLineIndex, 0];
			}
			
			return new FindSession(
				document.string,
				document.indexFromCursor(cursor),
				
				({index, match, groups, replace}) => {
					let cursor = document.cursorFromIndex(index);
					
					let selection = {
						start: cursor,
						end: document.cursorFromIndex(index + match.length),
					};
					
					return {
						index,
						cursor,
						selection,
						match,
						groups,
						
						replace(str) {
							let edit = editor.replaceSelection(selection, str);
							
							this.apply(edit); //
							
							replace(replaceWith);
							
							return edit;
						},
					};
				},
			);
		},
		
		search(search, type, caseMode) {
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
