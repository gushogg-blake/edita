module.exports = function(systemInfo) {
	return {
		font: "14px DejaVu Sans Mono",
		
		tabWidth: 4,
		defaultIndent: "\t",
		defaultNewline: systemInfo.newline,
		defaultLang: "javascript",
		
		lineNumberColor: "#9f9f9f",
		marginBackground: "#f0f0f0",
		selectionBackground: "#d0d0d0",
		hiliteBackground: "#fdee20",
		astSelectionBackground: "#dfdfdf",
		astSelectionHiliteBackground: "#F2F2F2",
		astInsertionHiliteBackground: "#606060",
		
		wrap: true,
		
		modeSwitchKey: "Escape",
		minHoldTime: 200,
		
		zoom: {
			stopAtProjectRoot: true,
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
			"Shift+Enter": "enter",
			"Ctrl+Enter": "enterNoAutoIndent",
			"Shift+Tab": "shiftTab",
			
			"Ctrl+X": "cut",
			"Ctrl+C": "copy",
			"Ctrl+V": "paste",
			"Ctrl+A": "selectAll",
			
			"Ctrl+Z": "undo",
			"Ctrl+Y": "redo",
			
			"Ctrl+Space": "completeWord",
			
			"Alt+I": "insertAstClipboard",
		},
		
		astKeymap: {
			"PageUp": "pageUp",
			"PageDown": "pageDown",
			"s": "up",
			"d": "down",
			"j": "next",
			"k": "previous",
			"i": "insert",
			"h": "collapseDown",
			"l": "collapseUp",
			//"e": "expandDown",
			"a": "selectSelection",
			"Space": "toggleSpaceBelow",
			"Shift+Space": "toggleSpaceAbove",
			"w": "wrap",
		},
		
		globalKeymap: {
			"Ctrl+O": "open",
			"Ctrl+S": "save",
			"Ctrl+N": "_new",
			"Ctrl+F": "find",
			"Ctrl+Shift+F": "findInOpenFiles",
			"Ctrl+H": "findAndReplace",
			"Ctrl+Shift+H": "findAndReplaceInOpenFiles",
			"Ctrl+W": "closeTab",
			"Ctrl+Shift+T": "reopenLastClosedTab",
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
		},
		
		fileAssociations: {
			"html": ["*.svelte"],
			//"plainText": ["*.js"],
		},
		
		cursorBlinkPeriod: 700,
		
		showPane: {
			left: true,
			right: true,
			bottom: true,
		},
	};
}
