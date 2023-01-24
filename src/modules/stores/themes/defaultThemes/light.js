let expandHiliteClasses = require("./expandHiliteClasses");

let theme = {
	name: "Light",
	
	app: {
		fontFamily: "\"Noto Sans\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
		fontSize: "12.5px",
		color: "#444444",
		
		appBorderColor: "#c5c3c1",
		appBorderLightColor: "#d5d3d0",
		appBorderMediumColor: "#d5d3d0",
		appBorder: "1px solid var(--appBorderColor)",
		appBorderLight: "1px solid var(--appBorderLightColor)",
		appBorderMedium: "1px solid var(--appBorderMediumColor)",
		appBackground: "#edecea",
		
		buttonColor: "#333333",
		buttonBorder: "var(--inputBorder)",
		buttonBackground: "#fbf9f6",
		buttonColorDisabled: "#555555",
		buttonBorderDisabled: "var(--inputBorder)",
		buttonBackgroundDisabled: "#fbf9f680",
		
		labelColor: "var(--buttonColor)",
		labelColorDisabled: "#777777",
		
		tabBackground: "transparent",
		tabSelectedBackground: "white",
		tabSelectedBorder: "2px solid #adaba5",
		toolbarBackground: "#f2f2f0",
		
		inputColor: "#444444",
		inputBorder: "1px solid #adaba6",
		inputBorderRadius: "3px",
		inputBackground: "white",
		inputColorDisabled: "#666666",
		inputBorderDisabled: "1px solid #adaba6",
		inputBackgroundDisabled: "#ffffff52",
		
		selectItemDivider: "1px solid #d1d0cc",
		selectItemHoverBackground: "#f3f3f3",
		
		treeEntrySelectedBackground: "rgba(0, 0, 0, 0.1)",
		treeEntryExpandContractBackground: "white",
		treeEntryExpandContractBorder: "#bbbbbb",
		
		dirEntryFolderBackground: "#b9d7f1",
		dirEntryFileBackground: "#fbfbfb",
		
		outputBackground: "#ffffff",
		
		messageColor: "var(--appColor)",
		messageBorder: "1px solid #7697bf",
		messageBackground: "#cce3ff",
		
		contextMenuColor: "var(--appColor)",
		contextMenuBorder: "1px solid #B4BBC1",
		contextMenuBackground: "white",
		contextMenuHoverColor: "white",
		contextMenuHoverBackground: "#71A339",
		
		scrollbarThumbWidth: "8px",
		scrollbarPadding: "3px",
		scrollbarWidth: "calc(var(--scrollbarThumbWidth) + var(--scrollbarPadding) * 2)",
		scrollbarBackground: "white",
		scrollbarBorder: "var(--appBorderLight)",
		scrollbarThumbBorder: "var(--scrollbarPadding) solid var(--scrollbarBackground)",
		scrollbarThumbBackground: "#B2B2B2",
		scrollbarSpacerBackground: "var(--appBackground)",
	},
	
	editor: {
		fontFamily: "\"DejaVu Sans Mono\", Menlo, Consolas, monospace",
		fontSize: "14px",
		defaultStyle: "#202020",
		
		cursorColor: "black",
		
		background: "white",
		selectionBackground: "#dddddd",
		hiliteBackground: "#fdee20",
		astSelectionBackground: "#dddddd",
		astSelectionHiliteBackground: "#f2f2f2",
		astInsertionHiliteBackground: "#606060",
		
		lineNumberColor: "#9f9f9f",
		marginBackground: "#f3f2f1",
		
		foldHeaderBackground: "#f2f2f2",
		foldHeaderBorder: "#a9a9a9",
	},
	
	langs: {
		javascript: {
			keyword: "#aa33aa",
			id: "#202020",
			comment: "#7f7f7f italic",
			symbol: "#bb22bb",
			bracket: "#202020",
			number: "#cc2222",
			string: "#2233bb",
			regex: "#cc7030",
			hashBang: "#202020",
		},
		
		html: {
			tag: "#0032ff",
			attribute: "#871f78",
			string: "#2233bb",
			text: "#000000",
			comment: "#7f7f7f italic",
		},
		
		css: {
			tagName: "#0032ff",
			className: "#008b8b",
			idName: "#8b0000",
			property: "#333333",
			attribute: "#871f78",
			string: "#2233bb",
			comment: "#7f7f7f italic",
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
			comment: "#7f7f7f italic",
			symbol: "#333333",
			text: "#000000",
		},
		
		php: {
			phpTag: "maroon",
			keyword: "#aa33aa",
			id: "#202020",
			comment: "#7f7f7f italic",
			symbol: "#bb22bb",
			bracket: "#202020",
			number: "#cc2222",
			string: "#2233bb",
		},
		
		markdown: {
			link: "#0338ff underline",
		},
		
		c: {
			keyword: "#0032ff",
			id: "#202020",
			comment: "#7f7f7f italic",
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
			comment: "#7f7f7f italic",
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
			comment: "#7f7f7f italic",
			symbol: "#202020",
			bracket: "#202020",
			number: "#cc2222",
			string: "#2233bb",
		},
	},
};

expandHiliteClasses(theme);

module.exports = theme;
