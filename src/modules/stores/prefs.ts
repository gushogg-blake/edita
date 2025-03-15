let JsonStore = require("modules/JsonStore");

let migrations = {
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
};

export default function() {
	let defaultPrefs = {
		tabWidth: 4,
		defaultIndent: "\t",
		defaultNewline: platform.systemInfo.newline,
		defaultLangCode: "javascript",
		defaultWrapLangs: ["markdown"],
		
		wrap: false,
		
		modeSwitchKey: "Escape",
		minHoldTime: 200,
		
		zoom: {
			stopAtProjectRoot: true,
		},
		
		copyLineIfSelectionNotFull: false,
		
		verticalSpacing: {
			spaceBlocks: true,
		},
		
		insertNestedSnippets: "blankLines",
		
		ctrlScrollMultiplier: 5,
		
		normalKeymap: {
			"ArrowUp": "up",
			"ArrowDown": "down",
			"Ctrl+ArrowUp": "up",
			"Ctrl+ArrowDown": "down",
			"ArrowLeft": "left",
			"ArrowRight": "right",
			"PageUp": "pageUp",
			"PageDown": "pageDown",
			"End": "end",
			"Home": "home",
			"Ctrl+End": "end",
			"Ctrl+Home": "home",
			"Ctrl+ArrowLeft": "wordLeft",
			"Ctrl+ArrowRight": "wordRight",
			"Shift+ArrowUp": "expandOrContractSelectionUp",
			"Shift+ArrowDown": "expandOrContractSelectionDown",
			"Shift+ArrowLeft": "expandOrContractSelectionLeft",
			"Shift+ArrowRight": "expandOrContractSelectionRight",
			"Shift+PageUp": "expandOrContractSelectionPageUp",
			"Shift+PageDown": "expandOrContractSelectionPageDown",
			"Shift+End": "expandOrContractSelectionEnd",
			"Ctrl+Shift+End": "expandOrContractSelectionEnd",
			"Shift+Home": "expandOrContractSelectionHome",
			"Ctrl+Shift+Home": "expandOrContractSelectionHome",
			"Ctrl+Shift+ArrowLeft": "expandOrContractSelectionWordLeft",
			"Ctrl+Shift+ArrowRight": "expandOrContractSelectionWordRight",
			
			"Backspace": "backspace",
			"Delete": "delete",
			"Enter": "enter",
			"Tab": "tab",
			"Shift+Backspace": "backspace",
			"Shift+Delete": "delete",
			"Ctrl+Backspace": "deleteWordLeft",
			"Ctrl+Delete": "deleteWordRight",
			"Shift+Enter": "enter",
			"Ctrl+Enter": "enterNoAutoIndent",
			"Shift+Tab": "shiftTab",
			"Alt+Enter": "newLineAfterSelection",
			"Alt+Shift+Enter": "newLineBeforeSelection",
			
			"Ctrl+X": "cut",
			"Ctrl+C": "copy",
			"Ctrl+V": "paste",
			"Ctrl+A": "selectAll",
			"Ctrl+Shift+V": "pasteAndIndent",
			
			"Ctrl+Space": "completeWord",
			"Ctrl+Shift+Space": "completeWordPrevious",
			
			"Alt+I": "insertAstClipboard",
			"Alt+O": "cursorAfterSnippet",
			
			"Alt+W": "wrap",
			"Alt+U": "unwrap",
			
			"Ctrl+K": "clearHilites",
		},
		
		editorMouseMap: {
			//"Ctrl+Wheel": "foldZoom",
		},
		
		astKeymap: {
			"PageUp": "pageUp",
			"PageDown": "pageDown",
			
			"s": "up",
			"d": "down",
			"j": "next",
			"k": "previous",
			
			"i": "insertAtEnd",
			"f": "insertAtBeginning",
			"h": "insertBefore",
			"l": "insertAfter",
			
			"Space": "toggleSpaceBelow",
			"Shift+Space": "toggleSpaceAbove",
			
			"3": "comment",
			"2": "uncomment",
			
			//"h": "collapseDown",
			//"l": "collapseUp",
			//"e": "expandDown",
			
			"a": "selectSelection",
		},
		
		astManipulationKeymap: {
			common: {
				"c": "$change",
				
				"f": "toggleMultilineOuter",
				"g": "toggleMultilineInner",
				
				"w": "wrap",
				"u": "unwrap",
			},
		},
		
		commonKeymap: {
			"Ctrl+2": "uncomment",
			"Ctrl+3": "comment",
			
			"Ctrl+Z": "undo",
			"Ctrl+Y": "redo",
			
			"Ctrl+9": "toggleWrap",
		},
		
		tabMouseMap: {
			"Alt+Wheel": "fileZoom",
		},
		
		globalKeymap: {
			"Ctrl+O": "open",
			"Ctrl+S": "save",
			"Ctrl+N": "_new",
			"Ctrl+L": "newWithLangSelector",
			
			"Ctrl+F": "find",
			"Ctrl+Shift+F": "findInOpenFiles",
			"Ctrl+H": "replace",
			"Ctrl+Shift+H": "replaceInOpenFiles",
			
			"Ctrl+W": "closeTab",
			"Ctrl+Shift+T": "reopenLastClosedTab",
			"Ctrl+Shift+W": "closeAllTabs",
			
			"Ctrl+PageUp": "selectPrevTab",
			"Ctrl+PageDown": "selectNextTab",
			
			"Ctrl+[": "toggleLeftPane",
			"Ctrl+]": "toggleRightPane",
			"Ctrl+-": "toggleBottomPane",
			
			"Ctrl+Shift+D": "toggleDevToolbar",
		},
		
		doubleClickSpeed: 400,
		
		fileAssociations: {
			"html": ["*.svelte"],
			//"plaintext": ["*.js"],
		},
		
		theme: "light",
		
		cursorBlinkPeriod: 700,
		
		panes: {
			left: {
				visible: false,
				size: 150,
			},
			
			right: {
				visible: false,
				size: 150,
			},
			
			bottom: {
				preferredSizes: {
					totalWithTopExpanded: 500,
					bottomContentsWithTop: 120,
					bottomContentsWithoutTop: 200,
				},
				
				top: {
					visible: false,
					expanded: false,
				},
				
				bottom: {
					visible: false,
					expanded: true,
				},
			},
		},
		
		showThemeSelector: false,
		
		dev: {
			showToolbar: false,
			timing: {},
			showThemeStyleElement: false,
			openFindAndReplace: false,
			openRefactor: false,
			logFocusedElement: false,
		},
	};
	
	return new JsonStore("prefs", defaultPrefs, migrations);
}
