export default {
	tabWidth: 4,
	defaultIndent: "\t",
	defaultLangCode: "typescript",
	defaultWrapLangs: ["markdown"],
	
	wrap: false,
	copyLineIfSelectionNotFull: false,
	
	modeSwitchKey: "Escape",
	minHoldTime: 200,
	
	customContextMenu: true,
	
	zoom: {
		stopAtProjectRoot: true,
	},
	
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
		"Ctrl+Alt+S": "saveAs",
		"Ctrl+Shift+S": "saveAll",
		"Ctrl+N": "_new",
		"Ctrl+L": "newWithLangSelector",
		"Ctrl+P": "fastOpen",
		//"Ctrl+Shift+P": "commandPalette",
		
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
		"Ctrl+#": "focusEditor",
		
		"Ctrl+Shift+D": "toggleDevToolbar",
	},
	
	doubleClickSpeed: 400,
	
	fileAssociations: {
		"html": ["*.svelte"],
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
