let set = require("lodash.set");
let defaultPerFilePrefs = require("modules/defaultPerFilePrefs");
let Tab = require("./Tab");

function fs(...args) {
	return platform.fs(...args);
}

class EditorTab extends Tab {
	constructor(app, editor) {
		super(app, "editor");
		
		this.editor = editor;
		this.currentPath = this.path;
		this.entries = [];
		this.loading = false;
		
		this.pendingActions = [];
		
		let {document, view} = editor;
		
		this.teardownCallbacks = [
			() => {
				this.editor.teardown();
			},
			
			document.on("save", this.onDocumentSave.bind(this)),
			document.on("urlChanged", this.onDocumentUrlChanged.bind(this)),
			view.on("wrapChanged", this.onWrapChanged.bind(this)),
			app.on("updatePanes", this.onAppUpdatePanes.bind(this)),
			...this.relayEvents(editor, ["focus", "blur"]),
		];
	}
	
	async init() {
		this.perFilePrefs = {
			...defaultPerFilePrefs(),
			...await this.getPerFilePrefs(),
		};
		
		this.applyPerFilePrefs();
	}
	
	get document() {
		return this.editor.document;
	}
	
	get url() {
		return this.document.url;
	}
	
	get project() {
		return this.document.project;
	}
	
	get isSaved() {
		return this.document.isSaved;
	}
	
	get modified() {
		return this.document.modified;
	}
	
	get view() {
		return this.editor.view;
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
	
	applyPerFilePrefs() {
		let {
			wrap,
		} = this.perFilePrefs;
		
		this.view.setWrap(wrap);
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
			this.app.openPath(entry.path);
		
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
	
	async onDocumentUrlChanged() {
		await this.writePerFilePrefs();
	}
	
	async onWrapChanged(wrap) {
		await this.setPerFilePref("wrap", wrap);
	}
	
	onAppUpdatePanes() {
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
	
	async setPerFilePrefs(prefs) {
		this.perFilePrefs = prefs;
		
		await this.writePerFilePrefs();
	}
	
	async writePerFilePrefs() {
		if (this.url.isNew) {
			return;
		}
		
		await base.stores.perFilePrefs.save(this.path, this.perFilePrefs);
	}
	
	async setPerFilePref(pref, value) {
		set(this.perFilePrefs, pref, value);
		
		await this.writePerFilePrefs();
	}
	
	async getPerFilePrefs() {
		if (this.url.isNew) {
			return {};
		}
		
		return await base.stores.perFilePrefs.load(this.path);
	}
	
	saveState() {
		let {url} = this;
		
		let {
			mode,
			normalSelection,
			astSelection,
			scrollPosition,
		} = this.view;
		
		return {
			url,
			mode,
			normalSelection,
			astSelection,
			scrollPosition,
		};
	}
	
	restoreState(details) {
		let {
			mode,
			normalSelection,
			astSelection,
			scrollPosition,
		} = details;
		
		let {editor} = this;
		
		editor.view.setScrollPosition(scrollPosition);
		
		editor.setMode(mode);
		
		if (mode === "normal") {
			editor.setNormalSelection(normalSelection);
			editor.updateSelectionEndCol();
		} else {
			editor.setAstSelection(astSelection);
		}
	}
	
	teardown() {
		super.teardown();
		
		this.document.teardown();
	}
}

module.exports = EditorTab;
