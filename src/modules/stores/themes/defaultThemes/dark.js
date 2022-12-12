let expandHiliteClasses = require("./expandHiliteClasses");

let theme = {
	name: "Dark",
	
	app: {
		color: "#d5d5d5",
		fontFamily: "\"Noto Sans\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
		fontSize: "12.5px",
		
		appBorderColor: "#606060",
		appBorderLightColor: "#606060",
		appBorderMediumColor: "#606060",
		appBorder: "1px solid var(--appBorderColor)",
		appBorderLight: "1px solid var(--appBorderLightColor)",
		appBorderMedium: "1px solid var(--appBorderMediumColor)",
		appBackground: "#303030",
		
		buttonColor: "#ffffffee",
		buttonBorder: "var(--inputBorder)",
		buttonBackground: "#ffffff15",
		buttonColorDisabled: "#ffffffaa",
		buttonBorderDisabled: "1px solid #626262",
		buttonBackgroundDisabled: "#ffffff05",
		
		labelColor: "var(--buttonColor)",
		labelColorDisabled: "var(--buttonColorDisabled)",
		
		tabBackground: "transparent",
		tabSelectedBackground: "#404040",
		tabSelectedBorder: "2px solid #898989",
		toolbarBackground: "#404040",
		
		inputColor: "var(--appColor)",
		inputBorder: "1px solid #8b8a89",
		inputBorderRadius: "3px",
		inputBackground: "#ffffff10",
		inputColorDisabled: "#666666",
		inputBorderDisabled: "1px solid #adaba6",
		inputBackgroundDisabled: "#ffffff52",
		
		selectItemDivider: "1px solid #707070",
		selectItemHoverBackground: "#565656",
		
		treeEntrySelectedBackground: "rgba(0, 0, 0, 0.1)",
		treeEntryExpandContractBackground: "#ffffff15",
		treeEntryExpandContractBorder: "#858585",
		
		dirEntryFolderBackground: "#9fcaef",
		dirEntryFileBackground: "#fbfbfbe8",
		
		outputBackground: "#505050",
		
		messageColor: "#ffffff",
		messageBorder: "1px solid #6b9ddb",
		messageBackground: "#3d72b3",
		
		contextMenuColor: "var(--appColor)",
		contextMenuBorder: "1px solid #7f868d",
		contextMenuBackground: "var(--appBackground)",
		contextMenuHoverColor: "white",
		contextMenuHoverBackground: "#ffffff20",
		
		scrollbarThumbWidth: "8px",
		scrollbarPadding: "3px",
		scrollbarWidth: "calc(var(--scrollbarThumbWidth) + var(--scrollbarPadding) * 2)",
		scrollbarBackground: "#505050",
		scrollbarBorder: "var(--appBorderLight)",
		scrollbarThumbBorder: "var(--scrollbarPadding) solid var(--scrollbarBackground)",
		scrollbarThumbBackground: "#909090",
		scrollbarSpacerBackground: "var(--appBackground)",
	},
	
	editor: {
		fontFamily: "\"DejaVu Sans Mono\", Menlo, Consolas, monospace",
		fontSize: "14px",
		defaultStyle: "#f0f0f0",
		
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
			comment: "#4686C1 italic",
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
			comment: "#aed7e5 italic",
		},
		
		css: {
			tagName: "#b58900",
			className: "#b58900",
			idName: "#b58900",
			property: "#859900",
			attribute: "#b58900",
			string: "#2AA198",
			comment: "#aed7e5 italic",
			symbol: "#839496",
			color: "#e8f8fd",
			number: "#e8f8fd",
			text: "#e8f8fd",
		},
		
		scss: {
			tagName: "#b58900",
			className: "#b58900",
			idName: "#b58900",
			property: "#859900",
			attribute: "#b58900",
			string: "#2AA198",
			comment: "#aed7e5 italic",
			symbol: "#839496",
			color: "#e8f8fd",
			number: "#e8f8fd",
			text: "#e8f8fd",
		},
		
		php: {
			phpTag: "#ec3636",
			keyword: "#54b9ec",
			id: "#e8f8fd",
			comment: "#4686C1 italic",
			symbol: "#5692cd",
			bracket: "#54B9EC",
			number: "#96defa",
			string: "#89e14b",
			regex: "#1ab3ec",
		},
		
		markdown: {
			link: "#8dc4ff underline",
		},
		
		c: {
			keyword: "#54b9ec",
			id: "#e8f8fd",
			comment: "#4686C1 italic",
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
			comment: "#4686C1 italic",
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
			comment: "#4686C1 italic",
			symbol: "#5692cd",
			bracket: "#54B9EC",
			number: "#96defa",
			string: "#89e14b",
			type: "#e8f8fd",
		},
	},
};

expandHiliteClasses(theme);

module.exports = theme;
