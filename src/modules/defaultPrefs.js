module.exports = function(systemInfo) {
	return {
		font: "14px DejaVu Sans Mono",
		
		tabWidth: 4,
		defaultIndent: "\t",
		defaultNewline: systemInfo.newline,
		defaultLangCode: "javascript",
		
		lineNumberColor: "#9f9f9f",
		marginBackground: "#f0f0f0",
		selectionBackground: "#d0d0d0",
		hiliteBackground: "#fdee20",
		astSelectionBackground: "#dfdfdf",
		astSelectionHiliteBackground: "#f2f2f2",
		astInsertionHiliteBackground: "#606060",
		foldHeaderBackground: "#f2f2f2",
		foldHeaderBorder: "#a9a9a9",
		
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
			"Shift+Home": "expandOrContractSelectionHome",
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
			
			"w": "wrap",
			"u": "unwrap",
			
			"i": "insertAtEnd",
			"f": "insertAtBeginning",
			"h": "insertBefore",
			"l": "insertAfter",
			
			//"h": "collapseDown",
			//"l": "collapseUp",
			//"e": "expandDown",
			
			"a": "selectSelection",
			
			"Space": "toggleSpaceBelow",
			"Shift+Space": "toggleSpaceAbove",
			
			"3": "comment",
			"2": "uncomment",
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
		},
		
		langs: {
			javascript: {
				colors: {
					keyword: "#aa33aa",
					id: "#202020",
					comment: "#7f7f7f",
					symbol: "#bb22bb",
					bracket: "#202020",
					number: "#cc2222",
					string: "#2233bb",
					regex: "#cc7030",
				},
			},
			
			html: {
				colors: {
					tag: "#0032ff",
					attribute: "#871f78",
					string: "#2233bb",
					text: "#000000",
					comment: "#7f7f7f",
				},
			},
			
			css: {
				colors: {
					tagName: "#0032ff",
					className: "#008b8b",
					idName: "#8b0000",
					property: "#333333",
					attribute: "#871f78",
					string: "#2233bb",
					comment: "#7f7f7f",
					symbol: "#333333",
					text: "#000000",
				},
			},
			
			scss: {
				colors: {
					tagName: "#0032ff",
					className: "#008b8b",
					idName: "#8b0000",
					property: "#333333",
					attribute: "#871f78",
					string: "#2233bb",
					comment: "#7f7f7f",
					symbol: "#333333",
					text: "#000000",
				},
			},
			
			php: {
				colors: {
					phpTag: "maroon",
					keyword: "#aa33aa",
					id: "#202020",
					comment: "#7f7f7f",
					symbol: "#bb22bb",
					bracket: "#202020",
					number: "#cc2222",
					string: "#2233bb",
				},
			},
			
			c: {
				colors: {
					keyword: "#0032ff",
					id: "#202020",
					comment: "#7f7f7f",
					include: "#7f7f7f",
					symbol: "#202020",
					bracket: "#202020",
					number: "#cc2222",
					string: "#2233bb",
					type: "#008b8b",
				},
			},
			
			cpp: {
				colors: {
					keyword: "#0032ff",
					id: "#202020",
					comment: "#7f7f7f",
					include: "#7f7f7f",
					symbol: "#202020",
					bracket: "#202020",
					number: "#cc2222",
					string: "#2233bb",
					type: "#008b8b",
				},
			},
			
			python: {
				colors: {
					keyword: "#0032ff",
					id: "#202020",
					comment: "#7f7f7f",
					symbol: "#202020",
					bracket: "#202020",
					number: "#cc2222",
					string: "#2233bb",
				},
			},
		},
		
		fileAssociations: {
			"html": ["*.svelte"],
			//"plainText": ["*.js"],
		},
		
		cursorBlinkPeriod: 700,
		
		panes: {
			left: {
				show: true,
				size: 150,
			},
			
			right: {
				show: true,
				size: 150,
			},
			
			bottom: {
				show: false,
				size: 240,
			},
		},
	};
}
