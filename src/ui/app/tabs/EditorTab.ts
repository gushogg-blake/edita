import set from "lodash.set";
import type {URL, Selection, AstSelection} from "core";
import type {DirEntry} from "base/DirEntries";
import type {Editor, EditorMode} from "ui/editor";
import type {ScrollPosition, Folds} from "ui/editor/view";
import type {App} from "ui/app";
import Tab from "./Tab";

export type SavedState = {
	url: URL;
	mode: EditorMode;
	normalSelection: Selection;
	astSelection: AstSelection;
	scrollPosition: ScrollPosition;
	folds: Folds;
};

function fs(...args) {
	return platform.fs(...args);
}

class EditorTab extends Tab<{
	focus: void;
	blur: void;
	zoomChange: void;
	updateDirListing: void;
}> {
	editor: Editor;
	
	private perFilePrefs: any; // TYPE
	private defaultPerFilePrefs: any; // TYPE
	private entries: DirEntry[] = [];
	private currentPath: string;
	private _label: any; // TYPE {label, disambiguator} from app.getEditorTabLabel
	private pendingActions: Array<() => void> = [];
	private loading: boolean = false;
	
	constructor(app: App, editor: Editor) {
		super(app, editor.document.resource);
		
		this.editor = editor;
		this.currentPath = this.path;
		
		let {document, view} = editor;
		
		this._label = app.getEditorTabLabel(this);
		
		this.teardownCallbacks = [
			() => {
				this.editor.teardown();
				// NOTE if we do multiple editors for one Document,
				// we need to change the logic here to keep track
				// of editors and only teardown when the last one
				// closes
				this.document.teardown();
			},
			
			document.on("save", this.onDocumentSave.bind(this)),
			document.on("resourceChanged", this.onDocumentResourceChanged.bind(this)),
			view.on("wrapChanged", this.onWrapChanged.bind(this)),
			app.on("pane.update", this.onAppPaneUpdate.bind(this)),
			app.on("updateTabLabels", this.onAppUpdateTabLabels.bind(this)),
			editor.on("focus", () => this.fire("focus")),
			editor.on("blur", () => this.fire("blur")),
		];
	}
	
	async init() {
		this.defaultPerFilePrefs = base.getDefaultPerFilePrefs(this.document);
		this.perFilePrefs = await this.loadPerFilePrefs();
		
		this.applyPerFilePrefs();
	}
	
	get document() {
		return this.editor.document;
	}
	
	// MIGRATE
	//get project() {
	//	return this.document.project;
	//}
	
	get isSaved() {
		return this.document.isSaved;
	}
	
	get modified() {
		return this.document.modified;
	}
	
	get view() {
		return this.editor.view;
	}
	
	get name() {
		return this._label.label;
	}
	
	get disambiguator() {
		return this._label.disambiguator;
	}
	
	get tooltip() {
		return this.path;
	}
	
	get windowTitle() {
		let title = platform.fs(this.path).name;
		
		if (this.isSaved) {
			title += " (" + platform.fs(this.path).parent.homePath + ")";
		}
		
		return title;
	}
	
	focus() {
		this.view.requestFocus();
	}
	
	show() {
		this.view.show();
	}
	
	hide() {
		this.view.hide();
	}
	
	async zoomOut() {
		if (!this.isSaved) {
			return;
		}
		
		if (this.loading) {
			this.pendingActions.push(this.zoomOut.bind(this));
			
			return;
		}
		
		if (
			base.prefs.zoom.stopAtProjectRoot
			&& this.currentPath !== this.path
			&& await this.document.lang.codeIntel?.isProjectRoot(this.currentPath)
		) {
			return;
		}
		
		this.loading = true;
		
		this.currentPath = fs(this.currentPath).parent.path;
		
		this.fire("zoomChange");
		
		await this.updateDirListing();
		
		this.loading = false;
		
		if (this.pendingActions.length > 0) {
			this.pendingActions.pop()();
		}
	}
	
	async zoomIn() {
		if (!this.isSaved) {
			return;
		}
		
		if (this.loading) {
			this.pendingActions.push(this.zoomIn.bind(this));
			
			return;
		}
		
		let original = fs(this.path);
		let current = fs(this.currentPath);
		
		if (!original.isDescendantOf(current)) {
			return;
		}
		
		let pathToOriginal = original.pathFrom(current).split(platform.path.sep);
		
		if (pathToOriginal[0] === "..") {
			return;
		}
		
		this.loading = true;
		
		if (pathToOriginal.length === 1) {
			this.currentPath = this.path;
		} else {
			this.currentPath = current.child(pathToOriginal[0]).path;
		}
		
		this.fire("zoomChange");
		
		await this.updateDirListing();
		
		this.loading = false;
		
		if (this.pendingActions.length > 0) {
			this.pendingActions.pop()();
		}
	}
	
	switchToFile(entry) {
		if (entry.isDir) {
			this.currentPath = entry.path;
			
			this.updateDirListing();
		} else {
			this.app.fileOperations.openPath(entry.path);
		
			this.currentPath = this.path;
		}
		
		this.fire("zoomChange");
	}
	
	openFile(entry) {
	}
	
	onDocumentSave() {
		this.currentPath = this.path;
		
		this.fire("zoomChange");
	}
	
	async onDocumentResourceChanged() {
		await this.writePerFilePrefs();
	}
	
	async onWrapChanged(wrap) {
		await this.setPerFilePref("wrap", wrap);
	}
	
	onAppUpdateTabLabels() {
		this._label = this.app.mainTabs.getEditorTabLabel(this);
	}
	
	onAppPaneUpdate() {
		this.view.requestResizeAsync();
	}
	
	async updateDirListing() {
		if (this.currentPath === this.path) {
			this.entries = [];
		} else {
			this.entries = await base.DirEntries.ls(this.currentPath);
		}
		
		this.fire("updateDirListing");
	}
	
	applyPerFilePrefs() {
		let {
			wrap,
		} = this.getPerFilePrefs();
		
		this.view.setWrap(wrap);
	}
	
	getPerFilePrefs() {
		return {
			...this.defaultPerFilePrefs,
			...this.perFilePrefs,
		};
	}
	
	async setPerFilePrefs(prefs) {
		this.perFilePrefs = prefs;
		
		await this.writePerFilePrefs();
	}
	
	async writePerFilePrefs() {
		if (this.url.isNew) {
			return;
		}
		
		await base.stores.perFilePrefs.createOrUpdate(this.path, this.perFilePrefs);
	}
	
	async setPerFilePref(pref, value) {
		set(this.perFilePrefs, pref, value);
		
		await this.writePerFilePrefs();
	}
	
	async loadPerFilePrefs() {
		if (this.url.isNew) {
			return {};
		}
		
		return await base.stores.perFilePrefs.load(this.path);
	}
	
	saveState(): SavedState {
		let {url} = this;
		
		let {
			mode,
			normalSelection,
			astSelection,
			scrollPosition,
			folds,
		} = this.view;
		
		return {
			url,
			mode,
			normalSelection,
			astSelection,
			scrollPosition,
			folds,
		};
	}
	
	restoreState(details: SavedState): void {
		let {
			mode,
			normalSelection,
			astSelection,
			scrollPosition,
			folds,
		} = details;
		
		let {editor} = this;
		let {view} = editor;
		
		view.setScrollPosition(scrollPosition);
		view.setFolds(folds);
		
		editor.setMode(mode);
		
		if (mode === "normal") {
			editor.setNormalSelection(normalSelection);
			editor.updateSelectionEndCol();
		} else {
			editor.setAstSelection(astSelection);
		}
	}
}

export default EditorTab;
