import LocalStorage from "../modules/stores/LocalStorage";

let defaultPrefs = {
	font: "14px DejaVu Sans Mono",
	indentWidth: 4,
	lineNumberColor: "#9f9f9f",
	marginBackground: "#f0f0f0",
	selectionBackground: "#d0d0d0",
	
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

export default new LocalStorage("prefs", defaultPrefs, Date.now(), {
	"*": function() {
		return defaultPrefs;
	},
});
