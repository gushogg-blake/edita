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
};

module.exports = function() {
	let defaultPrefs = {
		tabWidth: 4,
		defaultIndent: "\t",
		defaultNewline: platform.systemInfo.newline,
		defaultLangCode: "javascript",
		
		wrap: false,
		
		maxLineLengthForParsing: 300,
		
		modeSwitchKey: "Escape",
		minHoldTime: 200,
		
		zoom: {
			stopAtProjectRoot: true,
		},
		
		copyLineIfSelectionNotFull: false,
		
		verticalSpacing: {
			spaceBlocks: true,
		},
		
		normalKeymap: {
			"ArrowUp": "up",
			"ArrowDown": "down",
			"ArrowLeft": "left",
			"ArrowRight": "right",
			"PageUp": "pageUp",
			"PageDown": "pageDown",
			"End": "end",
			"Home": "home",
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
			
			"Alt+I": "insertAstClipboard",
			"Alt+O": "cursorAfterSnippet",
			
			"Alt+W": "wrap",
			"Alt+U": "unwrap",
			
			"Ctrl+K": "clearHilites",
		},
		
		editorMouseMap: {
			"Ctrl+Wheel": "foldZoom",
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
		},
		
		doubleClickSpeed: 400,
		
		fileAssociations: {
			"html": ["*.svelte"],
			//"plainText": ["*.js"],
		},
		
		theme: "light",
		
		cursorBlinkPeriod: 700,
		
		panes: {
			left: {
				visible: true,
				size: 150,
			},
			
			right: {
				visible: true,
				size: 150,
			},
			
			bottom: {
				visible: false,
				size: 240,
			},
		},
		
		showThemeSelector: false,
	};
	
	return new JsonStore("prefs", defaultPrefs, migrations);
}
