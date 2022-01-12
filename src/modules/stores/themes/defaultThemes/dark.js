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
		tabBackgroundColor: "transparent",
		tabSelectedBackgroundColor: "#505050",
		toolbarBackgroundColor: "#404040",
		
		inputColor: "var(--appColor)",
		inputBorder: "1px solid #adaba6",
		inputBackgroundColor: "#ffffff10",
		
		listItemSelectedBackgroundColor: "rgba(0, 0, 0, 0.1)",
		listItemExpandContractBackgroundColor: "#ffffff15",
		listItemExpandContractBorder: "#858585",
		
		dirEntryFolderBackgroundColor: "#9fcaef",
		dirEntryFileBackgroundColor: "#fbfbfbe8",
		
		findResultsBackgroundColor: "#505050",
		
		contextMenuColor: "var(--appColor)",
		contextMenuBorder: "1px solid #7f868d",
		contextMenuHoverBackgroundColor: "#ffffff20",
		contextMenuBackgroundColor: "var(--appBackgroundColor)",
		
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
		
		lineNumberColor: "#d0d0d0",
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
			tag: "#d6ad0c",//ffcd00
			attribute: "#e8f8fd",
			string: "#2aa198",
			text: "#e8f8fd",
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
			text: "#e8f8fd",
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
			text: "#e8f8fd",
		},
		
		php: {
			phpTag: "#ec3636",
			keyword: "#54b9ec",
			id: "#e8f8fd",
			comment: "#4686C1",
			symbol: "#5692cd",
			bracket: "#54B9EC",
			number: "#96defa",
			string: "#89e14b",
			regex: "#1ab3ec",
		},
		
		c: {
			keyword: "#54b9ec",
			id: "#e8f8fd",
			comment: "#4686C1",
			include: "#4686c1",
			symbol: "#5692cd",
			bracket: "#54B9EC",
			number: "#96defa",
			string: "#89e14b",
			type: "#e8f8fd",
		},
		
		cpp: {
			keyword: "#54b9ec",
			id: "#e8f8fd",
			comment: "#4686C1",
			include: "#4686c1",
			symbol: "#5692cd",
			bracket: "#54B9EC",
			number: "#96defa",
			string: "#89e14b",
			type: "#e8f8fd",
		},
		
		python: {
			keyword: "#54b9ec",
			id: "#e8f8fd",
			comment: "#4686C1",
			symbol: "#5692cd",
			bracket: "#54B9EC",
			number: "#96defa",
			string: "#89e14b",
			type: "#e8f8fd",
		},
	},
};
