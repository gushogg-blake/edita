/*
the main tabs (editors, and possibly others like RefactorPreview if that
gets done)
*/

export default class {
	constructor(app) {
		this.app = app;
		
		this.tabs = [];
		this.selectedTab = null;
		this.previouslySelectedTabs = [];
		this.closedTabs = [];
	}
	
	async newFile(resource) {
		let tab = await this.createEditorTab(resource);
		
		this.tabs.push(tab);
		
		this.fire("update");
		
		return tab;
	}
	
	async openFile(file) {
		let closeInitialNewFileTab = (
			this.editorTabs.length === 1
			&& this.editorTabs[0] === this.initialNewFileTab
			&& !this.initialNewFileTab.modified
		);
		
		if (closeInitialNewFileTab) {
			this.closeTab(this.initialNewFileTab);
		}
		
		let tab = await this.createEditorTab(file);
		
		this.tabs.splice(this.tabs.indexOf(this.selectedTab) + 1, 0, tab);
		
		this.fire("update");
		
		this.selectTab(tab);
	}
	
	selectTab(tab) {
		if (this.selectedTab) {
			this.addToPreviouslySelectedTabs(this.selectedTab);
		}
		
		this.selectedTab?.hide();
		
		this.selectedTab = tab;
		
		tab.select();
		tab.show();
		
		this.updateTitle();
		
		if (tab.isEditor) {
			this.output.clippingsTab?.setLang(tab.editor.document.lang);
		}
		
		this.fire("select", tab);
		
		this.focusSelectedTabAsync();
	}
	
	selectNextTab(dir) {
		if (!this.selectedTab) {
			return;
		}
		
		let {tabs} = this;
		let index = tabs.indexOf(this.selectedTab);
		let newIndex = index + dir;
		
		if (newIndex === -1) {
			newIndex = tabs.length - 1;
		}
		
		if (newIndex === tabs.length) {
			newIndex = 0;
		}
		
		this.selectTab(tabs[newIndex]);
	}
	
	addToPreviouslySelectedTabs(tab) {
		removeInPlace(this.previouslySelectedTabs, tab);
		
		this.previouslySelectedTabs.push(tab);
		
		if (this.previouslySelectedTabs.length > 10) {
			this.previouslySelectedTabs.shift();
		}
	}
	
	reorderTab(tab, index) {
		moveInPlace(this.tabs, tab, index);
		
		this.fire("update");
	}
	
	getEditorTabLabel(tab) {
		let sep = platform.systemInfo.pathSeparator;
		let node = platform.fs(tab.path);
		let {name, basename, extension} = node;
		let shortenedName = name;
		let prefixWithParentByConvention = "";
		
		// shorten
		
		if (basename.length > 20) {
			shortenedName = basename.substr(0, 8).trim() + "..." + basename.substr(-8).trim() + extension;
		}
		
		// conventions - always include dir for generic names like index.js
		
		if (multimatch(alwaysIncludeDirInTabTitle, node.name)) {
			prefixWithParentByConvention = node.parent.name + sep;
		}
		
		/*
		disambiguation
		
		start with the filename and for all tabs with same filename,
		step back until we find an ancestor dir that's different
		
		then, if we just stepped back one dir just prepend it
		
		otherwise, prepend the dir, /.../, then the filename (the dots
		representing path parts that are the same between tabs)
		*/
		
		if (node.parent.isRoot) {
			return shortenedName;
		}
		
		let others = this.editorTabs.map(other => platform.fs(other.path)).filter(function(other) {
			return (
				other.path !== node.path
				&& other.name === node.name
			);
		});
		
		if (others.length === 0) {
			return {
				label: prefixWithParentByConvention + shortenedName,
			};
		}
		
		let startNode = node;
		
		do {
			startNode = startNode.parent;
			others = others.map(other => other.parent);
		} while (others.some(other => other.name === startNode.name));
		
		if (startNode.isRoot) {
			/*
			other tabs' paths are our full path with a prefix -
			handle this case specially to avoid disambiguating it
			as //.../filename
			*/
			
			return {
				label: prefixWithParentByConvention + shortenedName,
			};
		}
		
		let disambiguator = "";
		
		if (startNode.path === node.parent.path) {
			disambiguator = prefixWithParentByConvention ? "" : startNode.name + sep;
		} else {
			disambiguator = startNode.name + sep + "..." + sep;
		}
		
		return {
			label: prefixWithParentByConvention + shortenedName,
			disambiguator,
		};
	}
	
	async closeTab(tab, noSave=false) {
		if (tab.modified) {
			let response = await this.app.showMessageBox({
				message: "Save changes to " + tab.name + "?",
				buttons: ["%Yes", "%No", "%Cancel"],
			});
			
			if (response === 0) {
				await this.app.fileOperations.save(tab);
				
				if (!tab.isSaved) {
					return;
				}
			} else if (response !== 1) {
				return;
			}
		}
		
		removeInPlace(this.previouslySelectedTabs, tab);
		
		let selectNext = null;
		
		if (this.selectedTab === tab) {
			this.selectedTab = null;
			
			let prevSelected = this.previouslySelectedTabs.pop();
			
			if (prevSelected) {
				selectNext = prevSelected;
			} else {
				let index = this.tabs.indexOf(tab);
				
				if (index > 0) {
					selectNext = this.tabs[index - 1];
				} else if (index < this.tabs.length - 1) {
					selectNext = this.tabs[index + 1];
				}
			}
		}
		
		tab.teardown();
		
		removeInPlace(this.tabs, tab);
		
		if (tab.isSaved && !noSave) {
			this.closedTabs.unshift(tab.saveState());
		}
		
		if (tab === this.initialNewFileTab) {
			this.initialNewFileTab = null;
		}
		
		if (selectNext) {
			this.selectTab(selectNext);
		}
		
		if (!selectNext) {
			this.updateTitle();
			this.focus();
		}
		
		this.fire("update");
		this.fire("tabClosed", tab);
	}
	
	async closeOthers(tab) {
		for (let other of this.editorTabs.filter(t => t !== tab)) {
			await this.closeTab(other);
		}
	}
	
	async createEditorTab(resource) {
		if (base.getPref("dev.timing.misc")) {
			console.time("createEditorTab");
		}
		
		await base.ensureRequiredLangsInitialised(resource.format.lang);
		
		let document = this.app.createDocument(resource);
		let view = new View(document);
		let editor = this._createEditor(document, view);
		
		editor.on("cut copy", (str) => {
			this.output.clippingsTab?.addClipping(str);
		});
		
		editor.on("normalSelectionChangedByMouseOrKeyboard", () => this.showAstHint(editor));
		
		editor.on("requestGoToDefinition", async ({path, selection}) => {
			let tab = await this.openPath(path);
			let {api} = tab.editor;
			
			api.setNormalHilites([selection], 700);
			api.centerSelection(selection);
		});
		
		let tab = new EditorTab(this, editor);
		
		await tab.init();
		
		tab.on("focus", this.onTabFocus.bind(this));
		
		this.fire("tabCreated", tab);
		this.fire("editorTabCreated", tab);
		
		if (base.getPref("dev.timing.misc")) {
			console.timeEnd("createEditorTab");
		}
		
		return tab;
	}
	
	async loadFromSessionAndStartup({tabsToOpen, urlToSelect}) {
		this.tabs = await bluebird.map(tabsToOpen, async ({file}) => {
			let url = URL.fromString(urlString);
			
			try {
				return this.createEditorTab(file);
			} catch (e) {
				console.error(e);
				
				return null;
			}
		}).filter(Boolean);
		
		for (let {url, state, isFromStartup} of tabsToOpen) {
			if (!isFromStartup) {
				this.findTabByUrl(url)?.restoreState(state);
			}
		}
		
		if (this.editorTabs.length > 0) {
			this.selectTab(urlToSelect && this.findTabByUrl(urlToSelect) || this.editorTabs.at(-1));
		} else {
			this.initialNewFileTab = this.fileOperations.newFile();
		}
		
		this.fire("update");
	}
	
	saveSession() {
		let tabs = this.editorTabs.map(function(tab) {
			return tab.isSaved ? tab.saveState() : null;
		}).filter(Boolean);
		
		return {
			tabs,
			selectedTabUrl: this.selectedTab?.url.toString(),
		};
	}
}
