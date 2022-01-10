module.exports = {
	name: "Light",
	
	app: {
		fontFamily: "\"Noto Sans\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
		fontSize: 12.5,
		color: "#444444",
		
		appBorder: "1px solid #afacaa",
		appBackgroundColor: "#edecea",
		
		buttonColor: "#333333",
		buttonBackgroundColor: "",
		tabBackgroundColor: "",
		tabSelectedBackgroundColor: "white",
		toolbarBackgroundColor: "#f2f2f0",
		
		inputBorder: "1px solid #adaba6",
		
		listItemSelectedBackgroundColor: "rgba(0, 0, 0, 0.1)",
		listItemExpandContractBackgroundColor: "white",
		listItemExpandContractBorder: "#bbbbbb",
		
		scrollbarThumbWidth: 8,
		scrollbarPadding: 3,
		scrollbarWidth: "calc(var(--scrollbarThumbWidth) + var(--scrollbarPadding) * 2)",
		scrollbarBackgroundColor: "white",
		scrollbarBorder: "1px solid #bababa",
		scrollbarThumbBorder: "var(--scrollbarPadding) solid var(--scrollbarBackgroundColor)",
		scrollbarThumbBackground: "#B2B2B2",
	},
	
	editor: {
		fontFamily: "\"DejaVu Sans Mono\", Menlo, Consolas, monospace",
		fontSize: 14,
		
		cursorColor: "black",
		selectionBackground: "#d0d0d0",
		hiliteBackground: "#fdee20",
		astSelectionBackground: "#dfdfdf",
		astSelectionHiliteBackground: "#f2f2f2",
		astInsertionHiliteBackground: "#606060",
		
		lineNumberColor: "#9f9f9f",
		marginBackground: "#f0f0f0",
		
		foldHeaderBackground: "#f2f2f2",
		foldHeaderBorder: "#a9a9a9",
	},
	
	langs: {
		javascript: {
			keyword: "#aa33aa",
			id: "#202020",
			comment: "#7f7f7f",
			symbol: "#bb22bb",
			bracket: "#202020",
			number: "#cc2222",
			string: "#2233bb",
			regex: "#cc7030",
		},
		
		html: {
			tag: "#0032ff",
			attribute: "#871f78",
			string: "#2233bb",
			text: "#000000",
			comment: "#7f7f7f",
		},
		
		css: {
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
		
		scss: {
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
