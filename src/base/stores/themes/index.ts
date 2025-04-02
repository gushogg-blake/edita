import bluebird from "bluebird";
import JsonStore from "base/stores/JsonStore";
import defaultThemes from "./defaultThemes";
import migrations from "./migrations";

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

export default async function() {
	let store = new JsonStore("themes", null, migrations);
	
	await bluebird.map(Object.entries(defaultThemes), async function([key, theme]) {
		if (!await store.load(key) || platform.config.dev) {
			await store.createOrUpdate(key, theme);
		}
	});
	
	return store;
}
