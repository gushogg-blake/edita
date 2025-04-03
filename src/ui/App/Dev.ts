import {Evented, sleep, sortedPartition} from "utils";
import type App from "ui/App";

function get(key) {
	return base.getPref("dev." + key);
}

export default class extends Evented<{
	showAstHint: any;
}> {
	private app: App;
	
	constructor(app: App) {
		super();
		
		this.app = app;
		
		this.init();
	}
	
	async init() {
		await sleep(0);
		
		setInterval(() => {
			if (get("logFocusedElement")) {
				// @ts-ignore
				console.log(app.mainTabs.selectedTab?.editor.view.focused);
				console.log(document.activeElement);
			}
		}, 1000);
		
		if (get("openFindAndReplace")) {
			//app.showFindAndReplace();
		}
		
		if (get("openRefactor")) {
			await app.refactor(["/home/gus/projects/edita/src/base/langs"]);
			
			let {refactor} = app.bottomPanes.tools.tabs[1];
			
			await sleep(200);
			
			//refactor.editors.find.api.edit(Selection.start(), `let /\\w+/ = require\\((string)\\);`);
			//refactor.editors.replaceWith.api.edit(Selection.start(), `@string`);
		}
	}
	
	showAstHint(editor) {
		if (!get("showAstHints")) {
			return;
		}
		
		let cursor = editor.normalSelection.left;
		let node = editor.document.getNodeAtCursor(cursor);
		
		if (!node) {
			return;
		}
		
		let lineage = node.lineage().slice(1);
		
		let [notOnLine, onLine] = sortedPartition(lineage, n => n.start.lineIndex !== cursor.lineIndex);
		
		this.fire("showAstHint", {
			all: lineage,
			notOnLine,
			onLine,
		});
	}
}
