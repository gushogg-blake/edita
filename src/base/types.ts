export type Prefs = {
	tabWidth: number;
	defaultIndent: string;
	defaultLangCode: string;
	defaultWrapLangs: string[];
	wrap: boolean;
	copyLineIfSelectionNotFull: boolean;
	modeSwitchKey: string;
	minHoldTime: number;
	customContextMenu: boolean;
	doubleClickSpeed: number;
	fileAssociations: Record<string, string[]>;
	theme: string;
	cursorBlinkPeriod: number;
	showThemeSelector: boolean;
	
	zoom: {
		stopAtProjectRoot: boolean;
	};
	
	verticalSpacing: {
		spaceBlocks: boolean;
	};
	
	insertNestedSnippets: "always" | "blankLines" | "never";
	ctrlScrollMultiplier: number;
	normalKeymap: Record<string, string>;
	
	editorMouseMap: Record<string, string>;
	astKeymap: Record<string, string>;
	
	astManipulationKeymap: {
		common: Record<string, string>;
	};
	
	commonKeymap: Record<string, string>;
	tabMouseMap: Record<string, string>;
	globalKeymap: Record<string, string>;
	
	panes: {
		left: {
			visible: boolean;
			size: number;
		};
		
		right: {
			visible: boolean;
			size: number;
		};
		
		bottom: {
			preferredSizes: {
				totalWithTopExpanded: number;
				bottomContentsWithTop: number;
				bottomContentsWithoutTop: number;
			};
			
			top: {
				visible: boolean;
				expanded: boolean;
			};
			
			bottom: {
				visible: boolean;
				expanded: boolean;
			};
		};
	};
	
	dev: any;
};

type LangHiliteClasses = Record<string, string>;

export type Theme = {
	name: string;
	
	app: {
		fontFamily: string;
		fontSize: string;
		color: string;
		
		appBorderColor: string;
		appBorderLightColor: string;
		appBorderMediumColor: string;
		appBorder: string;
		appBorderLight: string;
		appBorderMedium: string;
		appBackground: string;
		
		buttonColor: string;
		buttonBorder: string;
		buttonBackground: string;
		buttonColorDisabled: string;
		buttonBorderDisabled: string;
		buttonBackgroundDisabled: string;
		
		labelColor: string;
		labelColorDisabled: string;
		
		tabBackground: string;
		tabSelectedBackground: string;
		tabSelectedBorder: string;
		toolbarBackground: string;
		
		inputColor: string;
		inputBorder: string;
		inputBorderRadius: string;
		inputBackground: string;
		inputColorDisabled: string;
		inputBorderDisabled: string;
		inputBackgroundDisabled: string;
		
		selectItemDivider: string;
		selectItemHoverBackground: string;
		
		treeEntrySelectedBackground: string;
		treeEntryExpandContractBackground: string;
		treeEntryExpandContractBorder: string;
		
		dirEntryFolderBackground: string;
		dirEntryFileBackground: string;
		
		outputBackground: string;
		
		messageColor: string;
		messageBorder: string;
		messageBackground: string;
		
		contextMenuColor: string;
		contextMenuBorder: string;
		contextMenuBackground: string;
		contextMenuHoverColor: string;
		contextMenuHoverBackground: string;
		
		scrollbarThumbWidth: string;
		scrollbarPadding: string;
		scrollbarWidth: string;
		scrollbarBackground: string;
		scrollbarBorder: string;
		scrollbarThumbBorder: string;
		scrollbarThumbBackground: string;
		scrollbarSpacerBackground: string;
		
		fileChooserBackground: string;
	},
	
	editor: {
		fontFamily: string,
		fontSize: string;
		defaultStyle: string;
		
		cursorColor: string;
		
		background: string;
		selectionBackground: string;
		hiliteBackground: string;
		astSelectionBackground: string;
		astSelectionHiliteBackground: string;
		astInsertionHiliteBackground: string;
		
		lineNumberColor: string;
		marginBackground: string;
		
		foldHeaderBackground: string;
		foldHeaderBorder: string;
	},
	
	langs: Record<string, LangHiliteClasses>;
};
