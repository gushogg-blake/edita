import Writable from "../modules/stores/Writable";

let defaultPrefs = {
	font: "14px DejaVu Sans Mono",
	tabWidth: 4,
	defaultIndent: "\t",
	lineNumberColor: "#9f9f9f",
	marginBackground: "#f0f0f0",
	selectionBackground: "#d0d0d0",
	astSelectionBackground: "#c5e4ff",
	astHiliteBackground: "#F2F2F2",
	wrap: true,
	modeSwitchKey: "Escape",
	minHoldTime: 200,
	
	langs: {
		js: {
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
	},
	
	cursorBlinkPeriod: 700,
};

class Prefs extends Writable {
	init(...sources) {
		this.set(Object.assign({}, defaultPrefs, {
			defaultNewline: window.systemInfo.newline,
		}, ...sources));
	}
}

export default new Prefs();
