let bluebird = require("bluebird");
let JsonStore = require("modules/JsonStore");
let defaultThemes = require("./defaultThemes");

let migrations = {
	"1"(theme, key) {
		if (key !== "dark") {
			return;
		}
		
		let color = "#e8f8fd";
		
		theme.langs.css.color = color;
		theme.langs.css.text = color;
		
		theme.langs.scss.color = color;
		theme.langs.scss.text = color;
	},
	
	"2"(theme, key) {
		if (key !== "dark") {
			return;
		}
		
		let color = "#e8f8fd";
		
		theme.langs.css.number = color;
		
		theme.langs.scss.number = color;
	},
	
	"3"(theme, key) {
		theme.app.appBackground = theme.app.appBackgroundColor;
		theme.app.buttonBackground = theme.app.buttonBackgroundColor;
		theme.app.tabBackground = theme.app.tabBackgroundColor;
		theme.app.tabSelectedBackground = theme.app.tabSelectedBackgroundColor;
		theme.app.toolbarBackground = theme.app.toolbarBackgroundColor;
		theme.app.inputBackground = theme.app.inputBackgroundColor;
		theme.app.listItemSelectedBackground = theme.app.listItemSelectedBackgroundColor;
		theme.app.listItemExpandContractBackground = theme.app.listItemExpandContractBackgroundColor;
		theme.app.dirEntryFolderBackground = theme.app.dirEntryFolderBackgroundColor;
		theme.app.dirEntryFileBackground = theme.app.dirEntryFileBackgroundColor;
		theme.app.findResultsBackground = theme.app.findResultsBackgroundColor;
		theme.app.contextMenuBackground = theme.app.contextMenuBackgroundColor;
		theme.app.contextMenuHover = theme.app.contextMenuHoverColor;
		theme.app.contextMenuHoverBackground = theme.app.contextMenuHoverBackgroundColor;
		theme.app.scrollbarBackground = theme.app.scrollbarBackgroundColor;
		theme.app.scrollbarThumbBackground = theme.app.scrollbarThumbBackgroundColor;
		theme.app.scrollbarSpacerBackground = theme.app.scrollbarSpacerBackgroundColor;
		
		delete theme.app.appBackgroundColor;
		delete theme.app.buttonBackgroundColor;
		delete theme.app.tabBackgroundColor;
		delete theme.app.tabSelectedBackgroundColor;
		delete theme.app.toolbarBackgroundColor;
		delete theme.app.inputBackgroundColor;
		delete theme.app.listItemSelectedBackgroundColor;
		delete theme.app.listItemExpandContractBackgroundColor;
		delete theme.app.dirEntryFolderBackgroundColor;
		delete theme.app.dirEntryFileBackgroundColor;
		delete theme.app.findResultsBackgroundColor;
		delete theme.app.contextMenuBackgroundColor;
		delete theme.app.contextMenuHoverColor;
		delete theme.app.contextMenuHoverBackgroundColor;
		delete theme.app.scrollbarBackgroundColor;
		delete theme.app.scrollbarThumbBackgroundColor;
		delete theme.app.scrollbarSpacerBackgroundColor;
	},
	
	"3"(theme, key) {
		if (key !== "light") {
			return;
		}
		
		theme.app.buttonBackground = "#fbf9f6";
	},
};

module.exports = async function() {
	let store = new JsonStore("themes", null, migrations);
	
	await bluebird.map(Object.entries(defaultThemes), async function([key, theme]) {
		if (!await store.load(key) || platform.config.dev) {
			await store.save(key, theme);
		}
	});
	
	return store;
}
