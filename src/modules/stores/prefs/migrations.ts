export default {
	"1"(prefs) {
		prefs.astKeymap["c"] = "change";
	},
	
	"2"(prefs) {
		prefs.fontFamily = prefs.font;
		
		delete prefs.font;
	},
	
	"3"(prefs) {
		delete prefs.fontFamily;
		delete prefs.fontSize;
		
		delete prefs.lineNumberColor;
		delete prefs.marginBackground;
		delete prefs.selectionBackground;
		delete prefs.hiliteBackground;
		delete prefs.astSelectionBackground;
		delete prefs.astSelectionHiliteBackground;
		delete prefs.astInsertionHiliteBackground;
		delete prefs.foldHeaderBackground;
		delete prefs.foldHeaderBorder;
		
		delete prefs.langs;
		
		prefs.theme = "light";
	},
	
	"4"(prefs) {
		prefs.showThemeSelector = false;
	},
	
	"5"(prefs) {
		prefs.astKeymap["f"] = "toggleMultiline";
	},
	
	"6"(prefs) {
		delete prefs.astKeymap["c"];
		delete prefs.astKeymap["f"];
		delete prefs.astKeymap["w"];
		delete prefs.astKeymap["u"];
		
		prefs.astManipulationKeymap = {
			common: {
				"c": "$change",
				
				"f": "toggleMultilineOuter",
				"g": "toggleMultilineInner",
				
				"w": "wrap",
				"u": "unwrap",
			},
		};
	},
	
	"7"(prefs) {
		prefs.maxLineLengthForParsing = 300;
	},
	
	"8"(prefs) {
		prefs.normalKeymap[""] = "pasteAndIndent";
	},
	
	"9"(prefs) {
		prefs.normalKeymap["Ctrl+Shift+Space"] = "completeWordPrevious";
	},
	
	"10"(prefs) {
		delete prefs.normalKeymap[""];
		
		prefs.normalKeymap["Ctrl+Shift+V"] = "pasteAndIndent";
	},
	
	"11"(prefs) {
		delete prefs.maxLineLengthForParsing;
	},
	
	"12"(prefs) {
		prefs.dev = {
			showToolbar: false,
			timing: {},
			showThemeStyleElement: false,
		};
	},
	
	"13"(prefs) {
		prefs.dev = {
			showToolbar: false,
			timing: {},
			showThemeStyleElement: false,
			openFindAndReplace: false,
			logFocusedElement: false,
		};
	},
	
	"14"(prefs) {
		prefs.dev.openRefactor = false;
	},
	
	"15"(prefs) {
		delete prefs.panes.bottom;
		
		prefs.panes.bottom1 = {
			visible: false,
			size: 500,
		};
			
		prefs.panes.bottom2 = {
			visible: false,
			size: 240,
		};	
	},
	
	"16"(prefs) {
		delete prefs.panes.bottom1;
		delete prefs.panes.bottom2;
		
		prefs.panes.bottom = {
			preferredSizes: {
				totalWithTopExpanded: 500,
				bottomContents: 200,
			},
			
			top: {
				visible: true,
				expanded: false,
			},
			
			bottom: {
				visible: true,
				expanded: true,
			},
		};
	},
	
	"17"(prefs) {
		delete prefs.panes.bottom;
		
		prefs.panes.bottom = {
			preferredSizes: {
				totalWithTopExpanded: 500,
				bottomContents: 200,
			},
			
			top: {
				visible: true,
				expanded: false,
			},
			
			bottom: {
				visible: true,
				expanded: true,
			},
		};
	},
	
	"18"(prefs) {
		prefs.panes.bottom = {
			preferredSizes: {
				totalWithTopExpanded: 500,
				bottomContentsWithTop: 120,
				bottomContentsWithoutTop: 200,
			},
			
			top: {
				visible: true,
				expanded: false,
			},
			
			bottom: {
				visible: true,
				expanded: true,
			},
		};
	},
	
	"19"(prefs) {
		prefs.panes.left.visible = false;
		prefs.panes.right.visible = false;
		prefs.panes.bottom.top.visible = false;
		prefs.panes.bottom.bottom.visible = false;
	},
	
	"20"(prefs) {
		prefs.insertNestedSnippets = "blankLines";
	},
	
	"21"(prefs) {
		prefs.ctrlScrollMultiplier = 5;
		
		delete prefs.editorMouseMap["Ctrl+Wheel"];
	},
	
	"22"(prefs) {
		prefs.globalKeymap["Ctrl+L"] = "newWithLangSelector";
	},
	
	"25"(prefs) {
		prefs.defaultWrapLangs = ["markdown"];
	},
	
	"26"(prefs) {
		prefs.globalKeymap["Ctrl+Shift+D"] = "toggleDevToolbar";
	},
	
	"27"(prefs) {
		prefs.normalKeymap["Ctrl+End"] = "end";
		prefs.normalKeymap["Ctrl+Home"] = "home";
	},
	
	"28"(prefs) {
		prefs.normalKeymap["Ctrl+ArrowUp"] = "up";
		prefs.normalKeymap["Ctrl+ArrowDown"] = "down";
	},
	
	"29"(prefs) {
		prefs.globalKeymap["Ctrl+#"] = "focusEditor";
	},
	
	"30"(prefs) {
		prefs.customContextMenu = true;
	},
	
	"31"(prefs) {
		prefs.globalKeymap["Ctrl+Shift+P"] = "commandPalette";
		prefs.globalKeymap["Ctrl+P"] = "fastOpen";
	},
	
	"32"(prefs) {
		prefs.globalKeymap["Ctrl+Alt+S"] = "saveAs";
		prefs.globalKeymap["Ctrl+Shift+S"] = "saveAll";
	},
	
	"33"(prefs) {
		delete prefs.defaultNewline;
	},
};
