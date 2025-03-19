export default class {
	constructor(app) {
		this.app = app;
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
		
		this.fire("selectTab", tab);
		
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
		
		this.fire("updateTabs");
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
			let response = await this.showMessageBox({
				message: "Save changes to " + tab.name + "?",
				buttons: ["%Yes", "%No", "%Cancel"],
			});
			
			if (response === 0) {
				await this.save(tab);
				
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
		
		this.fire("updateTabs");
		this.fire("tabClosed", tab);
	}
	
	async closeOthers(tab) {
		for (let other of this.editorTabs.filter(t => t !== tab)) {
			await this.closeTab(other);
		}
	}
	
	async createEditorTab(code, url, format=null) {
		if (base.getPref("dev.timing.misc")) {
			console.time("createEditorTab");
		}
		
		if (!format) {
			format = base.getFormat(code, url);
		}
		
		let newlinesNormalised = false;
		
		if (format.hasMixedNewlines) {
			let {newline} = platform.systemInfo;
			let displayNewline = newline.replace("\n", "\\n").replace("\r", "\\r");
			
			alert("Warning: normalising mixed newlines to " + displayNewline + " to edit " + url.path);
			
			code = code.replaceAll("\r\n", newline);
			code = code.replaceAll("\r", newline);
			code = code.replaceAll("\n", newline);
			
			format.hasMixedNewlines = false;
			format.newline = newline;
			
			newlinesNormalised = true;
		}
		
		await base.ensureRequiredLangsInitialised(format.lang);
		
		let document = this.createDocument(code, url, {
			project: await this.projects.findOrCreateProjectForUrl(url),
			format,
			newlinesNormalised,
		});
		
		let view = new View(document);
		let editor = this._createEditor(document, view);
		let tab = new EditorTab(this, editor);
		
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
		
		await tab.init();
		
		tab.on("focus", this.onTabFocus.bind(this));
		
		this.fire("tabCreated", tab);
		this.fire("editorTabCreated", tab);
		
		if (base.getPref("dev.timing.misc")) {
			console.timeEnd("createEditorTab");
		}
		
		return tab;
	}
}
