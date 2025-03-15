import expandHiliteClasses from "./expandHiliteClasses";

let theme = {
	name: "Light",
	
	app: {
		fontFamily: "\"Noto Sans\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
		fontSize: "12.5px",
		color: "#444444",
		
		appBorderColor: "#d3d3d3",
		appBorderLightColor: "#d5d5d5",
		appBorderMediumColor: "#d5d5d5",
		appBorder: "1px solid var(--appBorderColor)",
		appBorderLight: "1px solid var(--appBorderLightColor)",
		appBorderMedium: "1px solid var(--appBorderMediumColor)",
		appBackground: "#ededed",
		
		buttonColor: "#333333",
		buttonBorder: "var(--inputBorder)",
		buttonBackground: "#f9f9f9",
		buttonColorDisabled: "#555555",
		buttonBorderDisabled: "var(--inputBorder)",
		buttonBackgroundDisabled: "#f9f9f980",
		
		labelColor: "var(--buttonColor)",
		labelColorDisabled: "#777777",
		
		tabBackground: "transparent",
		tabSelectedBackground: "white",
		tabSelectedBorder: "2px solid #adaba5",
		toolbarBackground: "#f2f2f2",
		
		inputColor: "#444444",
		inputBorder: "1px solid #adadad",
		inputBorderRadius: "3px",
		inputBackground: "white",
		inputColorDisabled: "#666666",
		inputBorderDisabled: "1px solid #adadad",
		inputBackgroundDisabled: "#ffffff52",
		
		selectItemDivider: "1px solid #d1d1d1",
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
		contextMenuBorder: "1px solid #bbbbbb",
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
		
		fileChooserBackground: "white",
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
		marginBackground: "#f3f3f3",
		
		foldHeaderBackground: "#f2f2f2",
		foldHeaderBorder: "#a9a9a9",
	},
	
	langs: {
		javascript: {
			keyword: "#004fc5",
			id: "#202020",
			comment: "#7f7f7f italic",
			symbol: "#202020",
			bracket: "#202020",
			number: "#42b0c9",
			string: "#4d9d10",
			regex: "#cc7030",
			hashBang: "#202020",
			jsx: "#c73700", // orange
			jsx: "#09849f", // turquoise
			//jsx: "#a7097d", // purple
			//jsx: "#a75209", // orange
			jsx: "#0032ff", // from html
			text: "#202020",
		},
		
		tsx: {
			keyword: "#004fc5",
			id: "#202020",
			comment: "#7f7f7f italic",
			symbol: "#202020",
			bracket: "#202020",
			//number: "#d30000",
			number: "#42b0c9",
			string: "#4d9d10",
			regex: "#cc7030",
			hashBang: "#202020",
			jsx: "#09849f", // turquoise
			jsx: "#0032ff", // from html
			text: "#202020",
		},
		
		vala: {
			keyword: "#004fc5",
			id: "#202020",
			comment: "#7f7f7f italic",
			symbol: "#202020",
			bracket: "#202020",
			number: "#42b0c9",
			string: "#4d9d10",
			regex: "#cc7030",
		},
		
		haskell: {
			keyword: "#004fc5",
			id: "#202020",
			comment: "#7f7f7f italic",
			symbol: "#202020",
			bracket: "#202020",
			number: "#42b0c9",
			string: "#4d9d10",
			regex: "#cc7030",
		},
		
		typescript: {
			keyword: "#004fc5",
			id: "#202020",
			comment: "#7f7f7f italic",
			symbol: "#202020",
			bracket: "#202020",
			//number: "#d30000",
			number: "#42b0c9",
			string: "#4d9d10",
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
			heading: "#202020 bold",
		},
		
		markdown_inline: {
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
		
		ruby: {
			keyword: "#0032ff",
			id: "#202020",
			comment: "#7f7f7f",
			symbol: "#202020",
			bracket: "#202020",
			number: "#cc2222",
			string: "#2233bb",
			regex: "#cc7030",
		},
		
		codepatterns: {
			lineQuantifier: "#d16a00", //#14898f
			regex: "#d16a00",
			literal: "#7f7f7f",
			captureLabel: "#0338ff",
			//delete: "#d10000",
		},
		
		tsq: {
			capture: "#0338ff",
			literal: "#7f7f7f",
			wildcard: "#d16a00",
			delete: "#d10000",
			keyword: "#23c1ab",
			string: "#2233bb",
		},
	},
};

expandHiliteClasses(theme);

export default theme;
