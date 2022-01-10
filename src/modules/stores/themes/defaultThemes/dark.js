module.exports = {
	name: "Dark",
	
	app: {
		color: "#d5d5d5",
		fontFamily: "\"Noto Sans\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
		fontSize: 12.5,
		
		appBorder: "1px solid #707070",
		appBackgroundColor: "#303030",
		
		buttonColor: "#ffffffee",
		buttonBackgroundColor: "#ffffff15",
		tabBackgroundColor: "#ffffff15",
		tabSelectedBackgroundColor: "#505050",
		toolbarBackgroundColor: "#404040",
		
		inputColor: "var(--appColor)",
		inputBorder: "1px solid #adaba6",
		inputBackgroundColor: "var(--appBackgroundColor)",
		
		listItemSelectedBackgroundColor: "rgba(0, 0, 0, 0.1)",
		listItemExpandContractBackgroundColor: "#ffffff15",
		listItemExpandContractBorder: "#858585",
		
		dirEntryFolderBackgroundColor: "#9fcaef",
		dirEntryFileBackgroundColor: "#fbfbfbe8",
		
		findResultsBackgroundColor: "#505050",
		
		scrollbarThumbWidth: 8,
		scrollbarPadding: 3,
		scrollbarWidth: "calc(var(--scrollbarThumbWidth) + var(--scrollbarPadding) * 2)",
		scrollbarBackgroundColor: "#505050",
		scrollbarBorder: "var(--appBorder)",
		scrollbarThumbBorder: "var(--scrollbarPadding) solid var(--scrollbarBackgroundColor)",
		scrollbarThumbBackgroundColor: "#909090",
		scrollbarSpacerBackgroundColor: "#606060",
	},
	
	editor: {
		fontFamily: "\"DejaVu Sans Mono\", Menlo, Consolas, monospace",
		fontSize: 14,
		defaultColor: "#f0f0f0",
		
		cursorColor: "#f0f0f0",
		
		background: "#404040",
		selectionBackground: "#606060",
		hiliteBackground: "#fdee2015",
		
		astSelectionBackground: "#202020",
		astSelectionHiliteBackground: "#303030",
		astInsertionHiliteBackground: "#d0d0d0",
		
		lineNumberColor: "#e0e0e0",
		marginBackground: "#505050",
		
		foldHeaderBackground: "#f2f2f2",
		foldHeaderBorder: "#a9a9a9",
	},
	
	langs: {
		javascript: {
			keyword: "#54b9ec",
			id: "#e8f8fd",
			comment: "#4686C1",
			symbol: "#5692cd",
			bracket: "#54B9EC",
			number: "#96defa",
			string: "#89e14b",
			regex: "#1ab3ec",
		},
		
		html: {
			tag: "#268bd2",
			attribute: "#839496",
			string: "#2aa198",
			text: "#839496",
			comment: "#aed7e5",
		},
		
		css: {
			tagName: "#b58900",
			className: "#b58900",
			idName: "#b58900",
			property: "#859900",
			attribute: "#b58900",
			string: "#2AA198",
			comment: "#aed7e5",
			symbol: "#839496",
			text: "#859900",
		},
		
		scss: {
			tagName: "#b58900",
			className: "#b58900",
			idName: "#b58900",
			property: "#859900",
			attribute: "#b58900",
			string: "#2AA198",
			comment: "#aed7e5",
			symbol: "#839496",
			text: "#859900",
		},
		
		php: {
			phpTag: "maroon",
			keyword: "#aa33aa",
			id: "#202020",
			comment: "#7f7f7f",
			symbol: "#bb22bb",
			bracket: "#202020",
			number: "#cc2222",
			string: "#2233bb",
		},
		
		c: {
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
		
		cpp: {
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
		
		python: {
			keyword: "#0032ff",
			id: "#202020",
			comment: "#7f7f7f",
			symbol: "#202020",
			bracket: "#202020",
			number: "#cc2222",
			string: "#2233bb",
		},
	},
};
